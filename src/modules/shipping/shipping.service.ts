import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockDataService } from '../../common/services/mock-data.service';
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

@Injectable()
export class ShippingService {
  constructor(
    private prisma: PrismaService,
    private mockData: MockDataService,
  ) {}

  async calculateCost(
    dto: CalculateCostRequestDto,
  ): Promise<CalculateCostResponseDto> {
    // 1. Obtener información de productos desde mock
    const productIds = dto.products.map(p => p.id);
    const stockInfo = await this.mockData.getStockInfo(productIds);
    
    // 2. Calcular peso total
    let totalWeight = 0;
    const productCosts = [];
    
    for (let i = 0; i < dto.products.length; i++) {
      const product = dto.products[i];
      const stock = stockInfo.find(s => s.id === product.id);
      
      if (!stock || !stock.available) {
        throw new BadRequestException(`Product ${product.id} not available`);
      }
      
      const productWeight = stock.weight * product.quantity;
      totalWeight += productWeight;
      
      productCosts.push({
        id: product.id,
        cost: stock.price * product.quantity,
      });
    }
    
    // 3. Calcular distancia usando mock
    const distanceInfo = await this.mockData.getDistanceInfo(
      dto.delivery_address.postal_code,
      'C1000ABC' // Origen fijo para testing
    );
    
    // 4. Calcular costo de envío
    const shippingCost = this.mockData.calculateShippingCost(
      distanceInfo.distance_km,
      totalWeight,
      'STANDARD' // Tipo por defecto para testing
    );
    
    // 5. Calcular costo total (productos + envío)
    const productTotal = productCosts.reduce((sum, p) => sum + p.cost, 0);
    const totalCost = productTotal + shippingCost.total_cost;

    return {
      currency: 'ARS',
      total_cost: Math.round(totalCost),
      transport_type: 'standard',
      products: productCosts,
      breakdown: {
        products_cost: productTotal,
        shipping_cost: shippingCost.total_cost,
        distance_km: distanceInfo.distance_km,
        weight_kg: totalWeight
      }
    };
  }

  async createShipping(
    dto: CreateShippingRequestDto,
  ): Promise<CreateShippingResponseDto> {
    // 1. Validar productos con Stock API (mock)
    const productIds = dto.products.map(p => p.id);
    const stockInfo = await this.mockData.getStockInfo(productIds);
    
    for (const stock of stockInfo) {
      if (!stock.available) {
        throw new BadRequestException(`Product ${stock.id} not available`);
      }
    }
    
    // 2. Calcular costo final
    let totalWeight = 0;
    for (let i = 0; i < dto.products.length; i++) {
      const product = dto.products[i];
      const stock = stockInfo.find(s => s.id === product.id);
      totalWeight += stock.weight * product.quantity;
    }
    
    const distanceInfo = await this.mockData.getDistanceInfo(
      dto.delivery_address.postal_code,
      'C1000ABC'
    );
    
    const shippingCost = this.mockData.calculateShippingCost(
      distanceInfo.distance_km,
      totalWeight,
      dto.transport_type.toUpperCase() as any
    );
    
    const productTotal = stockInfo.reduce((sum, stock) => {
      const product = dto.products.find(p => p.id === stock.id);
      return sum + (stock.price * product.quantity);
    }, 0);
    
    const totalCost = productTotal + shippingCost.total_cost;
    
    // 3. Generar tracking number
    const trackingNumber = this.mockData.generateTrackingNumber();
    
    // 4. Calcular tiempo de entrega estimado
    const deliveryDays = this.mockData.getEstimatedDeliveryTime(
      dto.transport_type.toUpperCase() as any,
      distanceInfo.distance_km
    );
    
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // 5. Crear registro en BD
    const shipping = await this.prisma.shipping.create({
      data: {
        orderId: dto.order_id,
        userId: dto.user_id,
        trackingNumber,
        deliveryStreet: dto.delivery_address.street,
        deliveryCity: dto.delivery_address.city,
        deliveryState: dto.delivery_address.state,
        deliveryPostalCode: dto.delivery_address.postal_code,
        deliveryCountry: dto.delivery_address.country,
        transportType: dto.transport_type.toUpperCase() as any,
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
      shipping_id: shipping.id,
      status: 'created',
      transport_type: dto.transport_type,
      tracking_number: trackingNumber,
      estimated_delivery_at: shipping.estimatedDeliveryAt.toISOString(),
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
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = Number(userId);
    if (status) where.status = status.toUpperCase();
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [shipments, total] = await Promise.all([
      this.prisma.shipping.findMany({
        where,
        skip,
        take: limit,
        include: {
          products: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.shipping.count({ where }),
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
    const shipping = await this.prisma.shipping.findUnique({
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
            city: shipping.departureCity!,
            state: shipping.departureState!,
            postal_code: shipping.departurePostalCode!,
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
    const shipping = await this.prisma.shipping.findUnique({
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

    const updated = await this.prisma.shipping.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        logs: {
          create: {
            status: 'CANCELLED',
            message: 'Shipment cancelled by user',
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

