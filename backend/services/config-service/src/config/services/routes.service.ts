import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@logistics/database';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPendingShipments(): Promise<any[]> {
    this.logger.log('Fetching pending shipments for routing');

    // Buscar envíos CREATED que no estén asignados a ninguna ruta (routeStop es null)
    const shipments = await this.prisma.shipment.findMany({
      where: {
        status: 'CREATED',
        routeStop: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        trackingNumber: true,
        deliveryStreet: true,
        deliveryCity: true,
        deliveryPostalCode: true,
        totalCost: true,
        estimatedDeliveryAt: true,
        transportType: true,
        products: {
          select: {
            quantity: true,
            productId: true,
            productReference: true,
          },
        },
      },
    });

    return shipments;
  }

  async validateCapacity(
    vehicleId: string,
    shipmentIds: string[],
  ): Promise<any> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const shipments = await this.prisma.shipment.findMany({
      where: { id: { in: shipmentIds } },
      include: { products: true },
    });

    let totalWeight = 0;
    // Estimación: 10kg por unidad si no hay info real en BD
    shipments.forEach((s) => {
      s.products.forEach((p) => {
        totalWeight += p.quantity * 10;
      });
    });

    const isOverloaded = totalWeight > vehicle.capacityKg;

    if (isOverloaded) {
      this.logger.warn(
        `Vehicle ${vehicle.license_plate} overloaded: ${totalWeight}/${vehicle.capacityKg}`,
      );
    }

    return {
      valid: !isOverloaded,
      totalWeight,
      capacity: vehicle.capacityKg,
      utilization: Math.round((totalWeight / vehicle.capacityKg) * 100),
    };
  }
}
