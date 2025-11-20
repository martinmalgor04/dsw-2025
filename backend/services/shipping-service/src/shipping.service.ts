import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { MockDataService } from './services/mock-data.service';
import { DistanceCalculationService } from './services/distance-calculation.service';
import { TariffCalculationService } from './services/tariff-calculation.service';
import { PostalCodeValidationService } from './services/postal-code-validation.service';
import { PrismaService } from '@logistics/database';
import { LoggerService } from '@logistics/utils';
import {
  CalculateCostRequestDto,
  CalculateCostResponseDto,
} from './dto/calculate-cost.dto';
import {
  CreateShippingRequestDto,
  CreateShippingResponseDto,
} from './dto/create-shipping.dto';
import {
  ShippingDetailDto,
  ListShippingResponseDto,
  CancelShippingResponseDto,
} from './dto/shipping-responses.dto';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@Injectable()
export class ShippingService {
  private readonly logger = new LoggerService(ShippingService.name);
  private readonly stockServiceUrl: string;

  constructor(
    private mockData: MockDataService,
    private configService: ConfigService,
    private httpService: HttpService,
    private distanceService: DistanceCalculationService,
    private tariffService: TariffCalculationService,
    private postalValidator: PostalCodeValidationService,
    private prisma: PrismaService,
  ) {
    this.stockServiceUrl = this.configService.get<string>(
      'STOCK_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  private async getProductInfo(productId: number): Promise<any> {
    try {
      const url = `${this.stockServiceUrl}/stock/productos/${productId}`;
      const response = await lastValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error fetching product ${productId} from stock service`,
        error,
      );
      throw new BadRequestException(
        `Product ${productId} not available or stock service error`,
      );
    }
  }

  async getTransportMethods(): Promise<TransportMethodsResponseDto> {
    const configServiceUrl = this.configService.get<string>(
      'CONFIG_SERVICE_URL',
      'http://localhost:3003',
    );

    try {
      const response = await lastValueFrom(
        this.httpService.get(`${configServiceUrl}/config/transport-methods`),
      );

      const methods = response.data;

      return {
        transport_methods: methods
          .filter((m: any) => m.isActive)
          .map((m: any) => ({
            type: m.code,
            name: m.name,
            estimated_days: m.estimatedDays,
          })),
      };
    } catch (error) {
      this.logger.error(
        'Error fetching transport methods from config service',
        error,
      );
      throw new BadRequestException('Could not fetch transport methods');
    }
  }

  async calculateCost(
    dto: CalculateCostRequestDto,
  ): Promise<CalculateCostResponseDto> {
    // Validate postal code
    const postal = this.postalValidator.validate(
      dto.delivery_address.postal_code,
    );
    if (!postal.isValid)
      throw new BadRequestException(postal.errors.join(', '));

    // Fetch stock info from real service
    const productIds = dto.products.map((p) => p.id);
    const stockInfo = await Promise.all(
      productIds.map((id) => this.getProductInfo(id)),
    );

    // Weight and product totals
    let totalWeight = 0;
    const productCosts: { id: number; cost: number }[] = [];
    
    // Use the first product's location as departure address (simplification)
    const departurePostalCode = stockInfo[0]?.ubicacion?.postal_code || 'C1000ABC';

    for (const item of dto.products) {
      const stock = stockInfo.find((s) => s.id === item.id);
      if (
        !stock ||
        stock.stockDisponible < item.quantity || // Check available stock
        !stock.pesoKg ||
        !stock.precio
      ) {
        throw new BadRequestException(
          `Product ${item.id} not available or missing data`,
        );
      }
      totalWeight += stock.pesoKg * item.quantity;
      productCosts.push({ id: item.id, cost: stock.precio * item.quantity });
    }

    // Distance
    const distanceRes = await this.distanceService.calculateDistance(
      dto.delivery_address.postal_code,
      departurePostalCode,
    );

    // Tariff calculation (using default transport method)
    // TODO: Get transport method from request or use default
    const defaultTransportMethodId = 'default-road-transport'; // This should be a real ID from the database
    const tariff = await this.tariffService.calculateTariff({
      transportMethodId: defaultTransportMethodId,
      billableWeight: totalWeight,
      distance: distanceRes.distance,
      environment: this.configService.get('NODE_ENV') || 'development',
    });

    const productTotal = productCosts.reduce((sum, p) => sum + p.cost, 0);
    const totalCost = productTotal + tariff.totalCost;

    return {
      currency: 'ARS',
      total_cost: Math.round(totalCost),
      transport_type: 'standard',
      products: productCosts,
      breakdown: {
        products_cost: productTotal,
        shipping_cost: tariff.totalCost,
        distance_km: distanceRes.distance,
        weight_kg: totalWeight,
      },
    };
  }

  async createShipping(
    dto: CreateShippingRequestDto,
  ): Promise<CreateShippingResponseDto> {
    // 1. Validar productos con Stock API (real)
    const productIds = dto.products.map((p) => p.id);
    const stockInfo = await Promise.all(
      productIds.map((id) => this.getProductInfo(id)),
    );

    for (let i = 0; i < dto.products.length; i++) {
      const productRequest = dto.products[i];
      const stock = stockInfo.find((s) => s.id === productRequest.id);
      
      if (!stock) {
         throw new BadRequestException(`Product ${productRequest.id} not found`);
      }
      
      if (stock.stockDisponible < productRequest.quantity) {
        throw new BadRequestException(
          `Product ${stock.id} has insufficient stock (Requested: ${productRequest.quantity}, Available: ${stock.stockDisponible})`
        );
      }
    }

    // 2. Calcular costo final (usando lógica real, no mock)
    let totalWeight = 0;
    // Use the first product's location as departure address
    const departurePostalCode = stockInfo[0]?.ubicacion?.postal_code || 'C1000ABC';

    for (let i = 0; i < dto.products.length; i++) {
      const product = dto.products[i];
      const stock = stockInfo.find((s) => s.id === product.id);
      if (stock && stock.pesoKg) {
        totalWeight += stock.pesoKg * product.quantity;
      }
    }

    // Calcular distancia real
    const distanceRes = await this.distanceService.calculateDistance(
      dto.delivery_address.postal_code,
      departurePostalCode,
    );

    // Calcular tarifa real
    // Buscar el método de transporte por código (AIR, ROAD, etc.)
    const transportMethodCode = dto.transport_type.toUpperCase();
    const transportMethod = await this.prisma.transportMethod.findFirst({
      where: { code: transportMethodCode, isActive: true }
    });

    if (!transportMethod) {
      throw new BadRequestException(`Transport method '${transportMethodCode}' not available`);
    }

    const tariff = await this.tariffService.calculateTariff({
        transportMethodId: transportMethod.id,
        billableWeight: totalWeight,
        distance: distanceRes.distance,
        environment: this.configService.get('NODE_ENV') || 'development',
    });

    const productTotal = stockInfo.reduce((sum, stock) => {
      const product = dto.products.find((p) => p.id === stock.id);
      if (stock.precio && product) {
        return sum + stock.precio * product.quantity;
      }
      return sum;
    }, 0);

    const totalCost = productTotal + tariff.totalCost;

    // 3. Generar tracking number
    const trackingNumber = this.mockData.generateTrackingNumber();

    // 4. Calcular tiempo de entrega estimado
    const deliveryDays = this.mockData.getEstimatedDeliveryTime(
      dto.transport_type.toUpperCase() as any,
      distanceRes.distance,
    );

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // 5. Crear registro en BD
    // Use actual departure address from stock info
    const stockLocation = stockInfo[0]?.ubicacion || {};

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId: dto.order_id,
        userId: dto.user_id,
        trackingNumber,
        deliveryStreet: dto.delivery_address.street,
        deliveryCity: dto.delivery_address.city,
        deliveryState: dto.delivery_address.state,
        deliveryPostalCode: dto.delivery_address.postal_code,
        deliveryCountry: dto.delivery_address.country,
        departureStreet: stockLocation.street,
        departureCity: stockLocation.city,
        departureState: stockLocation.state,
        departurePostalCode: stockLocation.postal_code,
        departureCountry: stockLocation.country,
        transportType: dto.transport_type.toUpperCase(),
        status: 'CREATED',
        totalCost,
        currency: 'ARS',
        estimatedDeliveryAt: estimatedDelivery,
        products: {
          create: dto.products.map((p) => ({
            productId: p.id,
            quantity: p.quantity,
          })),
        },
        logs: {
          create: {
            status: 'CREATED',
            message: `Shipment created with tracking number: ${trackingNumber}`,
          },
        },
      },
    });

    return {
      shipping_id: shipment.id,
      status: shipment.status.toLowerCase(),
      transport_type: shipment.transportType,
      tracking_number: shipment.trackingNumber,
      estimated_delivery_at: shipment.estimatedDeliveryAt.toISOString(),
    };
  }

  async listShipments(filters: {
    userId?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page: number;
    limit: number;
  }): Promise<ListShippingResponseDto> {
    const { userId, status, fromDate, toDate, page, limit } = filters;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status.toUpperCase();
    }
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        include: {
          products: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      shipments: shipments.map((s) => ({
        shipping_id: s.id,
        order_id: s.orderId,
        user_id: s.userId,
        products: s.products.map((p) => ({
          product_id: p.productId,
          quantity: p.quantity,
        })),
        status: s.status.toLowerCase(),
        transport_type: s.transportType.toLowerCase(),
        estimated_delivery_at: s.estimatedDeliveryAt.toISOString(),
        created_at: s.createdAt.toISOString(),
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  async getShippingDetail(id: string): Promise<ShippingDetailDto> {
    const shipping = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        products: true,
        logs: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!shipping) {
      throw new NotFoundException('Shipping not found');
    }

    return {
      shipping_id: shipping.id,
      order_id: shipping.orderId,
      user_id: shipping.userId,
      delivery_address: {
        street: shipping.deliveryStreet,
        city: shipping.deliveryCity,
        state: shipping.deliveryState,
        postal_code: shipping.deliveryPostalCode,
        country: shipping.deliveryCountry,
      },
      departure_address: shipping.departureStreet
        ? {
            street: shipping.departureStreet,
            city: shipping.departureCity,
            state: shipping.departureState,
            postal_code: shipping.departurePostalCode,
            country: shipping.departureCountry,
          }
        : undefined,
      products: shipping.products.map((p) => ({
        product_id: p.productId,
        quantity: p.quantity,
      })),
      status: shipping.status.toLowerCase(),
      transport_type: shipping.transportType.toLowerCase(),
      tracking_number: shipping.trackingNumber || undefined,
      carrier_name: shipping.carrierName || undefined,
      total_cost: Number(shipping.totalCost),
      currency: shipping.currency,
      estimated_delivery_at: shipping.estimatedDeliveryAt.toISOString(),
      created_at: shipping.createdAt.toISOString(),
      updated_at: shipping.updatedAt.toISOString(),
      logs: shipping.logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        status: log.status.toLowerCase(),
        message: log.message,
      })),
    };
  }

  async cancelShipping(id: string): Promise<CancelShippingResponseDto> {
    const shipping = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipping) {
      throw new NotFoundException('Shipping not found');
    }

    if (!['CREATED', 'RESERVED'].includes(shipping.status)) {
      throw new BadRequestException(
        `Shipment cannot be cancelled. Current status '${shipping.status.toLowerCase()}' does not allow cancellation.`,
      );
    }

    const cancelledAt = new Date();

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt,
        logs: {
          create: {
            status: 'CANCELLED',
            message: 'Shipment cancelled by user',
            timestamp: cancelledAt,
          },
        },
      },
    });

    return {
      shipping_id: updated.id,
      status: 'cancelled',
      cancelled_at: updated.cancelledAt!.toISOString(),
    };
  }
}
