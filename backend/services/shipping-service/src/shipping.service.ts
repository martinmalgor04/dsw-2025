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
import { AddressDto } from '@logistics/types';
import {
  CalculateCostRequestDto,
  CalculateCostResponseDto,
  FlexibleProductDto,
  ProductDimensionsDto,
  ShippingLocationDto,
} from './dto/calculate-cost.dto';
import {
  CreateShippingRequestDto,
  CreateShippingResponseDto,
} from './dto/create-shipping.dto';
import {
  ShippingDetailDto,
  ListShippingResponseDto,
  CancelShippingResponseDto,
  PublicShippingTrackingDto,
} from './dto/shipping-responses.dto';
import { UpdateShippingStatusDto } from './dto/update-status.dto';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

type DetailedCostRequest = CalculateCostRequestDto & {
  origin: ShippingLocationDto;
  destination: ShippingLocationDto;
  transportType?: string;
};

@Injectable()
export class ShippingService {
  private readonly logger = new LoggerService(ShippingService.name);
  private readonly stockServiceUrl: string;
  private readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  private hashStringToInt(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) % 2147483629;
    }
    return hash === 0 ? 1 : hash;
  }

  private normalizeCountryCode(value?: string): string {
    if (!value) {
      return 'AR';
    }
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length === 2) {
      return trimmed;
    }
    return trimmed.slice(0, 2);
  }

  private normalizeIdentifier(
    label: 'user' | 'order',
    numeric?: number,
    reference?: string,
  ): { id: number; reference: string } {
    if (numeric && Number.isFinite(numeric) && numeric > 0) {
      return { id: numeric, reference: reference ?? `${numeric}` };
    }
    if (reference) {
      return { id: this.hashStringToInt(reference), reference };
    }
    if (label === 'order') {
      const generated = `ORD-${this.mockData.generateTrackingNumber()}`;
      return { id: this.hashStringToInt(generated), reference: generated };
    }
    throw new BadRequestException(`Missing ${label} identifier`);
  }

  private resolveProductIdentifier(
    product: FlexibleProductDto,
  ): { id: number; reference: string } {
    if (product.id && product.id > 0) {
      return {
        id: product.id,
        reference: product.productId ?? `${product.id}`,
      };
    }
    if (product.productId) {
      const digits = product.productId.match(/\d+/g)?.join('');
      if (digits) {
        return { id: parseInt(digits, 10), reference: product.productId };
      }
      return {
        id: this.hashStringToInt(product.productId),
        reference: product.productId,
      };
    }
    throw new BadRequestException('Each product must include id or productId');
  }

  private normalizeTransportCode(type?: string): string {
    const normalized = (type ?? 'ROAD').toUpperCase();
    switch (normalized) {
      case 'GROUND':
      case 'ROAD':
        return 'ROAD';
      case 'EXPRESS':
      case 'AIR':
        return 'AIR';
      case 'SEA':
        return 'SEA';
      case 'RAIL':
        return 'RAIL';
      default:
        throw new BadRequestException(
          `Transport type '${type}' is not supported`,
        );
    }
  }

  private hasDetailedCreationPayload(
    dto: CreateShippingRequestDto,
  ): boolean {
    return Boolean(
      dto.origin &&
        (dto.destination || dto.delivery_address),
    );
  }

  private ensureValidUuid(id: string, label: string) {
    if (!this.uuidPattern.test(id)) {
      throw new BadRequestException(
        `${label} must be a valid UUID (received: ${id})`,
      );
    }
  }

  private mapAddressResponse(
    prefix: 'delivery' | 'departure',
    shipping: any,
  ) {
    const street = shipping[`${prefix}Street`];
    if (!street) return undefined;
    return {
      street,
      city: shipping[`${prefix}City`],
      state: shipping[`${prefix}State`],
      postal_code: shipping[`${prefix}PostalCode`],
      country: shipping[`${prefix}Country`],
    };
  }

  private buildCreateShippingResponse(
    shipment: any,
  ): CreateShippingResponseDto {
    return {
      shipping_id: shipment.id,
      order_id: shipment.orderId, // ID numérico de la compra que origina el envío
      user_id: shipment.userId, // ID numérico del usuario
      status: shipment.status,
      transport_type: shipment.transportType,
      tracking_number: shipment.trackingNumber,
      estimated_delivery_at: shipment.estimatedDeliveryAt.toISOString(),
      total_cost: Number(shipment.totalCost),
      currency: shipment.currency,
      delivery_address: this.mapAddressResponse('delivery', shipment)!,
      departure_address: this.mapAddressResponse('departure', shipment),
    };
  }

  private toShippingLocation(
    address?: AddressDto | ShippingLocationDto,
  ): ShippingLocationDto | undefined {
    if (!address) return undefined;
    if ((address as ShippingLocationDto).postalCode) {
      return address as ShippingLocationDto;
    }
    const parsed = address as AddressDto;
    return {
      street: parsed.street,
      city: parsed.city,
      state: parsed.state,
      postalCode: parsed.postal_code,
      country: parsed.country,
    };
  }

  private isDetailedCostRequest(
    dto: CalculateCostRequestDto,
  ): dto is DetailedCostRequest {
    return Boolean(dto.origin && dto.destination);
  }

  private ensureFormattedPostalCode(
    value: string | undefined,
    label: string,
  ): string {
    if (!value) {
      throw new BadRequestException(`${label} postal code is required`);
    }
    const result = this.postalValidator.validate(value);
    if (!result.isValid || !result.formatted) {
      throw new BadRequestException(
        `${label} postal code invalid: ${result.errors.join(', ')}`,
      );
    }
    return result.formatted;
  }

  private mapTransportTypeToMock(
    transportType: string,
  ): 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' {
    const code = this.normalizeTransportCode(transportType);
    switch (code) {
      case 'AIR':
        return 'EXPRESS';
      case 'SEA':
      case 'RAIL':
        return 'OVERNIGHT';
      case 'ROAD':
      default:
        return 'STANDARD';
    }
  }

  private calculateFallbackVolumetricWeight(
    dimensions: ProductDimensionsDto,
  ): number {
    const volumeCm =
      (dimensions.length ?? 0) *
      (dimensions.width ?? 0) *
      (dimensions.height ?? 0);
    const divisor = 5000; // estándar IATA aproximado
    const weight = volumeCm / divisor;
    return Math.round(weight * 100) / 100;
  }

  private buildMockTariff(
    distance: number,
    billableWeight: number,
    mockTransport: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT',
  ) {
    const mockQuote = this.mockData.calculateShippingCost(
      distance,
      billableWeight,
      mockTransport,
    );

    return {
      totalCost: mockQuote.total_cost,
      breakdown: {
        baseTariff: mockQuote.base_cost,
        weightCost: mockQuote.weight_cost,
        distanceCost: mockQuote.distance_cost,
        billableWeight,
        distance,
      },
    };
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
    if (this.isDetailedCostRequest(dto)) {
      return this.calculateCostFromDetailedRequest(dto);
    }
    return this.calculateCostFromLegacyRequest(dto);
  }

  private async calculateCostFromDetailedRequest(
    dto: DetailedCostRequest,
  ): Promise<CalculateCostResponseDto> {
    const originPostal = this.ensureFormattedPostalCode(
      dto.origin.postalCode,
      'Origin',
    );
    const destinationPostal = this.ensureFormattedPostalCode(
      dto.destination.postalCode,
      'Destination',
    );

    const requestedTransport = dto.transportType ?? 'ROAD';
    const transportCode = this.normalizeTransportCode(requestedTransport);
    const transportMethod = await this.prisma.transportMethod.findFirst({
      where: { code: transportCode, isActive: true },
    });
    if (!transportMethod) {
      this.logger.warn(
        `Transport method '${transportCode}' not registered. Using fallback tariff calculation.`,
      );
    }

    const environment = this.configService.get('NODE_ENV') || 'development';

    let totalPhysicalWeight = 0;
    const volumetricWeights = await Promise.all(
      dto.products.map(async (product) => {
        if (typeof product.weight !== 'number') {
          throw new BadRequestException(
            `Product ${
              product.productId ?? product.id
            } must include weight in kilograms`,
          );
        }
        if (product.weight <= 0) {
          throw new BadRequestException(
            `Product ${
              product.productId ?? product.id
            } must include weight greater than zero`,
          );
        }
        totalPhysicalWeight += product.weight * product.quantity;

        if (!product.dimensions) {
          return 0;
        }

        if (!transportMethod) {
          return (
            this.calculateFallbackVolumetricWeight(product.dimensions) *
            product.quantity
          );
        }

        const volumetricPerUnit =
          await this.tariffService.calculateVolumetricWeight(
            product.dimensions,
            transportMethod.id,
            environment,
          );
        return volumetricPerUnit * product.quantity;
      }),
    );

    const volumetricWeight = volumetricWeights.reduce(
      (sum, value) => sum + value,
      0,
    );
    const billableWeight = Math.max(totalPhysicalWeight, volumetricWeight);

    const distanceResult = await this.distanceService.calculateDistance(
      originPostal,
      destinationPostal,
    );

    let tariff:
      | {
          totalCost: number;
          breakdown: {
            baseTariff: number;
            weightCost: number;
            distanceCost: number;
            billableWeight: number;
            distance: number;
          };
        }
      | undefined;
    if (transportMethod) {
      try {
        tariff = await this.tariffService.calculateTariff({
          transportMethodId: transportMethod.id,
          billableWeight,
          distance: distanceResult.distance,
          environment,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to obtain tariff for ${transportCode}: ${error.message}`,
        );
      }
    }

    const mockTransport = this.mapTransportTypeToMock(transportCode);
    const roundedDistance = Math.round(distanceResult.distance * 100) / 100;
    const roundedPhysicalWeight =
      Math.round(totalPhysicalWeight * 100) / 100;
    const roundedBillableWeight = Math.round(billableWeight * 100) / 100;

    if (!tariff) {
      tariff = this.buildMockTariff(
        roundedDistance,
        roundedBillableWeight,
        mockTransport,
      );
    }

    const breakdown = tariff.breakdown;
    const volumetricRounded = Math.round(volumetricWeight * 100) / 100;

    return {
      quote_id: this.mockData.generateTrackingNumber(),
      currency: 'ARS',
      total_cost: tariff.totalCost,
      transport_type: requestedTransport,
      products: [],
      distance: roundedDistance,
      estimatedDeliveryDays: this.mockData.getEstimatedDeliveryTime(
        mockTransport,
        distanceResult.distance,
      ),
      totalWeight: roundedPhysicalWeight,
      billableWeight: roundedBillableWeight,
      breakdown: {
        baseCost: breakdown.baseTariff ?? 0,
        weightCost: breakdown.weightCost ?? 0,
        distanceCost: breakdown.distanceCost ?? 0,
        billableWeight: roundedBillableWeight,
        volumetricWeight: volumetricRounded,
        products_cost: 0,
        shipping_cost: tariff.totalCost,
        distance_km: roundedDistance,
        weight_kg: roundedPhysicalWeight,
      },
    };
  }

  private async calculateCostFromLegacyRequest(
    dto: CalculateCostRequestDto,
  ): Promise<CalculateCostResponseDto> {
    if (!dto.delivery_address) {
      throw new BadRequestException(
        'delivery_address is required when origin/destination are not provided',
      );
    }

    if (!dto.products || dto.products.length === 0) {
      throw new BadRequestException('At least one product is required');
    }

    const postalValidation = this.postalValidator.validate(
      dto.delivery_address.postal_code,
    );
    if (!postalValidation.isValid || !postalValidation.formatted) {
      throw new BadRequestException(postalValidation.errors.join(', '));
    }

    const productIds = dto.products.map((p) => {
      if (typeof p.id !== 'number') {
        throw new BadRequestException(
          'Product id must be numeric in legacy requests',
        );
      }
      return p.id;
    });

    const stockInfo = await Promise.all(
      productIds.map((id) => this.getProductInfo(id)),
    );

    let totalWeight = 0;
    const productCosts: { id: number; cost: number }[] = [];

    const departurePostalCode =
      stockInfo[0]?.ubicacion?.postal_code || 'C1000ABC';

    for (const item of dto.products) {
      const stock = stockInfo.find((s) => s.id === item.id);
      if (
        !stock ||
        stock.stockDisponible < item.quantity ||
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

    const distanceRes = await this.distanceService.calculateDistance(
      postalValidation.formatted,
      departurePostalCode,
    );

    const environment = this.configService.get('NODE_ENV') || 'development';
    const transportCode = 'ROAD';
    const transportMethod = await this.prisma.transportMethod.findFirst({
      where: { code: transportCode, isActive: true },
    });
    const transportMethodId =
      transportMethod?.id || 'default-road-transport';

    const tariff = await this.tariffService.calculateTariff({
      transportMethodId,
      billableWeight: totalWeight,
      distance: distanceRes.distance,
      environment,
    });

    const productTotal = productCosts.reduce((sum, p) => sum + p.cost, 0);
    const totalCost = productTotal + tariff.totalCost;

    const mockTransport = this.mapTransportTypeToMock(transportCode);

    const roundedDistance = Math.round(distanceRes.distance * 100) / 100;
    const roundedPhysicalWeight = Math.round(totalWeight * 100) / 100;

    return {
      quote_id: this.mockData.generateTrackingNumber(),
      currency: 'ARS',
      total_cost: Math.round(totalCost),
      transport_type: transportCode,
      products: productCosts,
      distance: roundedDistance,
      estimatedDeliveryDays: this.mockData.getEstimatedDeliveryTime(
        mockTransport,
        distanceRes.distance,
      ),
      totalWeight: roundedPhysicalWeight,
      billableWeight: Math.round(tariff.breakdown.billableWeight * 100) / 100,
      breakdown: {
        baseCost: tariff.breakdown.baseTariff,
        weightCost: tariff.breakdown.weightCost,
        distanceCost: tariff.breakdown.distanceCost,
        billableWeight: tariff.breakdown.billableWeight,
        products_cost: productTotal,
        shipping_cost: tariff.totalCost,
        distance_km: roundedDistance,
        weight_kg: roundedPhysicalWeight,
      },
    };
  }

  async createShipping(
    dto: CreateShippingRequestDto,
  ): Promise<CreateShippingResponseDto> {
    if (this.hasDetailedCreationPayload(dto)) {
      return this.createShippingFromDetailedPayload(dto);
    }
    return this.createShippingFromLegacyPayload(dto);
  }

  private async createShippingFromDetailedPayload(
    dto: CreateShippingRequestDto,
  ): Promise<CreateShippingResponseDto> {
    const destination =
      this.toShippingLocation(dto.destination) ??
      this.toShippingLocation(dto.delivery_address);
    const origin = this.toShippingLocation(dto.origin);

    if (!destination || !origin) {
      throw new BadRequestException(
        'origin and destination are required for detailed shipping payloads',
      );
    }

    const requestedTransport =
      dto.transportType ?? dto.transport_type ?? 'ROAD';
    const transportCode = this.normalizeTransportCode(requestedTransport);
    const costResult = await this.calculateCostFromDetailedRequest({
      origin,
      destination,
      products: dto.products,
      transportType: transportCode,
    } as DetailedCostRequest);

    const { id: userId, reference: userReference } = this.normalizeIdentifier(
      'user',
      dto.user_id,
      dto.userId ?? dto.user_reference,
    );
    const { id: orderId, reference: orderReference } = this.normalizeIdentifier(
      'order',
      dto.order_id,
      dto.orderId ?? dto.order_reference,
    );

    const trackingNumber = this.mockData.generateTrackingNumber();
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + costResult.estimatedDeliveryDays!,
    );

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        orderReference,
        userId,
        userReference,
        trackingNumber,
        deliveryStreet: destination.street,
        deliveryCity: destination.city,
        deliveryState: destination.state,
        deliveryPostalCode: destination.postalCode,
        deliveryCountry: this.normalizeCountryCode(destination.country),
        departureStreet: origin.street,
        departureCity: origin.city,
        departureState: origin.state,
        departurePostalCode: origin.postalCode,
        departureCountry: this.normalizeCountryCode(origin.country),
        transportType: transportCode,
        status: 'CREATED',
        totalCost: costResult.total_cost,
        currency: costResult.currency ?? 'ARS',
        estimatedDeliveryAt: estimatedDelivery,
        products: {
          create: dto.products.map((product) => {
            const { id, reference } = this.resolveProductIdentifier(product);
            return {
              productId: id,
              productReference: reference,
              quantity: product.quantity,
            };
          }),
        },
        logs: {
          create: {
            status: 'CREATED',
            message: `Shipment created with tracking number: ${trackingNumber}`,
          },
        },
      },
    });

    return this.buildCreateShippingResponse(shipment);
  }

  private async createShippingFromLegacyPayload(
    dto: CreateShippingRequestDto,
  ): Promise<CreateShippingResponseDto> {
    if (!dto.delivery_address) {
      throw new BadRequestException('delivery_address is required');
    }

    const productIds = dto.products.map((p) => {
      if (!p.id) {
        throw new BadRequestException(
          'Legacy shipping requests must include numeric product id',
        );
      }
      return p.id;
    });

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
          `Product ${stock.id} has insufficient stock (Requested: ${productRequest.quantity}, Available: ${stock.stockDisponible})`,
        );
      }
    }

    let totalWeight = 0;
    const departurePostalCode =
      stockInfo[0]?.ubicacion?.postal_code || 'C1000AAA';

    for (const product of dto.products) {
      const stock = stockInfo.find((s) => s.id === product.id);
      if (stock && stock.pesoKg) {
        totalWeight += stock.pesoKg * product.quantity;
      }
    }

    const distanceRes = await this.distanceService.calculateDistance(
      dto.delivery_address.postal_code,
      departurePostalCode,
    );

    const transportMethodCode = this.normalizeTransportCode(
      dto.transport_type,
    );
    const transportMethod = await this.prisma.transportMethod.findFirst({
      where: { code: transportMethodCode, isActive: true },
    });

    if (!transportMethod) {
      throw new BadRequestException(
        `Transport method '${transportMethodCode}' not available`,
      );
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
    const trackingNumber = this.mockData.generateTrackingNumber();
    const deliveryDays = this.mockData.getEstimatedDeliveryTime(
      transportMethodCode as any,
      distanceRes.distance,
    );

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);
    const stockLocation = stockInfo[0]?.ubicacion || {};

    const { id: userId, reference: userReference } = this.normalizeIdentifier(
      'user',
      dto.user_id,
      dto.userId ?? dto.user_reference,
    );
    const { id: orderId, reference: orderReference } = this.normalizeIdentifier(
      'order',
      dto.order_id,
      dto.orderId ?? dto.order_reference,
    );

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        orderReference,
        userId,
        userReference,
        trackingNumber,
        deliveryStreet: dto.delivery_address.street,
        deliveryCity: dto.delivery_address.city,
        deliveryState: dto.delivery_address.state,
        deliveryPostalCode: dto.delivery_address.postal_code,
        deliveryCountry: this.normalizeCountryCode(
          dto.delivery_address.country,
        ),
        departureStreet: stockLocation.street,
        departureCity: stockLocation.city,
        departureState: stockLocation.state,
        departurePostalCode: stockLocation.postal_code,
        departureCountry: this.normalizeCountryCode(stockLocation.country),
        transportType: transportMethodCode,
        status: 'CREATED',
        totalCost,
        currency: 'ARS',
        estimatedDeliveryAt: estimatedDelivery,
        products: {
          create: dto.products.map((p) => ({
            productId: p.id!,
            productReference: `${p.id}`,
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

    return this.buildCreateShippingResponse(shipment);
  }

  async listShipments(filters: {
    userId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ListShippingResponseDto> {
    const { userId, status, fromDate, toDate, page, limit } = filters;

    const pageNumber =
      Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const limitNumber =
      Number.isFinite(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 20;

    const where: any = {};

    if (userId) {
      if (/^\d+$/.test(userId)) {
        where.userId = Number(userId);
      } else {
        where.userReference = userId;
      }
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
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      shipments: shipments.map((s) => ({
        shipping_id: s.id,
        order_id: s.orderId, // ID numérico de la compra que origina el envío
        user_id: s.userId, // ID numérico del usuario
        products: s.products.map((p) => ({
          product_id: p.productId,
          quantity: p.quantity,
          reference: p.productReference ?? `${p.productId}`,
        })),
        status: s.status,
        transport_type: s.transportType,
        tracking_number: s.trackingNumber || undefined,
        delivery_address: this.mapAddressResponse('delivery', s) || undefined,
        estimated_delivery_at: s.estimatedDeliveryAt.toISOString(),
        created_at: s.createdAt.toISOString(),
      })),
      total,
      page: pageNumber,
      limit: limitNumber,
    };
  }

  async getShippingByTrackingNumber(trackingNumber: string): Promise<ShippingDetailDto> {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new BadRequestException('Tracking number is required');
    }

    const shipping = await this.prisma.shipment.findFirst({
      where: { trackingNumber: trackingNumber.trim() },
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
      throw new NotFoundException('Shipping not found with the provided tracking number');
    }

    return {
      shipping_id: shipping.id,
      order_id: shipping.orderId, // ID numérico de la compra que origina el envío
      user_id: shipping.userId, // ID numérico del usuario
      delivery_address: this.mapAddressResponse('delivery', shipping)!,
      departure_address: this.mapAddressResponse('departure', shipping),
      products: shipping.products.map((p) => ({
        product_id: p.productId,
        quantity: p.quantity,
        reference: p.productReference ?? `${p.productId}`,
      })),
      status: shipping.status,
      transport_type: shipping.transportType,
      tracking_number: shipping.trackingNumber || undefined,
      carrier_name: shipping.carrierName || undefined,
      total_cost: Number(shipping.totalCost),
      currency: shipping.currency,
      estimated_delivery_at: shipping.estimatedDeliveryAt.toISOString(),
      created_at: shipping.createdAt.toISOString(),
      updated_at: shipping.updatedAt.toISOString(),
      logs: shipping.logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        message: log.message,
      })),
    };
  }

  async getPublicTrackingByTrackingNumber(
    trackingNumber: string,
  ): Promise<PublicShippingTrackingDto> {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new BadRequestException('Tracking number is required');
    }

    const shipping = await this.prisma.shipment.findFirst({
      where: { trackingNumber: trackingNumber.trim() },
      include: {
        logs: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!shipping) {
      throw new NotFoundException(
        'Shipping not found with the provided tracking number',
      );
    }

    return {
      shipping_id: shipping.id,
      tracking_number: shipping.trackingNumber,
      status: shipping.status,
      delivery_address: this.mapAddressResponse('delivery', shipping)!,
      estimated_delivery_at: shipping.estimatedDeliveryAt.toISOString(),
      created_at: shipping.createdAt.toISOString(),
      logs: shipping.logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        message: log.message,
      })),
    };
  }

  async getShippingDetail(id: string): Promise<ShippingDetailDto> {
    this.ensureValidUuid(id, 'Shipment id');
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
      order_id: shipping.orderId, // ID numérico de la compra que origina el envío
      user_id: shipping.userId, // ID numérico del usuario
      delivery_address: this.mapAddressResponse('delivery', shipping)!,
      departure_address: this.mapAddressResponse('departure', shipping),
      products: shipping.products.map((p) => ({
        product_id: p.productId,
        quantity: p.quantity,
        reference: p.productReference ?? `${p.productId}`,
      })),
      status: shipping.status,
      transport_type: shipping.transportType,
      tracking_number: shipping.trackingNumber || undefined,
      carrier_name: shipping.carrierName || undefined,
      total_cost: Number(shipping.totalCost),
      currency: shipping.currency,
      estimated_delivery_at: shipping.estimatedDeliveryAt.toISOString(),
      created_at: shipping.createdAt.toISOString(),
      updated_at: shipping.updatedAt.toISOString(),
      logs: shipping.logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        message: log.message,
      })),
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateShippingStatusDto,
  ): Promise<ShippingDetailDto> {
    this.ensureValidUuid(id, 'Shipment id');

    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
        logs: {
          create: {
            status: dto.status,
            message: dto.message || `Status updated to ${dto.status}`,
          },
        },
      },
      include: {
        products: true,
        logs: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    return {
      shipping_id: updated.id,
      order_id: updated.orderId, // ID numérico de la compra que origina el envío
      user_id: updated.userId, // ID numérico del usuario
      delivery_address: this.mapAddressResponse('delivery', updated)!,
      departure_address: this.mapAddressResponse('departure', updated),
      products: updated.products.map((p) => ({
        product_id: p.productId,
        quantity: p.quantity,
        reference: p.productReference ?? `${p.productId}`,
      })),
      status: updated.status,
      transport_type: updated.transportType,
      tracking_number: updated.trackingNumber || undefined,
      carrier_name: updated.carrierName || undefined,
      total_cost: Number(updated.totalCost),
      currency: updated.currency,
      estimated_delivery_at: updated.estimatedDeliveryAt.toISOString(),
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
      logs: updated.logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        message: log.message,
      })),
    };
  }

  async cancelShipping(id: string): Promise<CancelShippingResponseDto> {
    this.ensureValidUuid(id, 'Shipment id');
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
      status: 'CANCELLED',
      cancelled_at: updated.cancelledAt!.toISOString(),
      message: 'Shipment cancelled successfully',
    };
  }
}
