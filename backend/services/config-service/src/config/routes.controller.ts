import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RoutesService } from './services/routes.service';

@ApiTags('🚛 Flota - Rutas')
@Controller('fleet/routes')
export class RoutesController {
  private readonly logger = new Logger(RoutesController.name);

  constructor(private readonly routesService: RoutesService) {}

  @Get('pending-shipments')
  @ApiOperation({
    summary: '📦 Obtener envíos pendientes de ruta',
    description:
      'Retorna lista de envíos en estado CREATED que aún no han sido asignados a ninguna hoja de ruta.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de envíos pendientes',
  })
  async getPendingShipments(): Promise<any[]> {
    return this.routesService.getPendingShipments();
  }

  @Get('validate-capacity')
  @ApiOperation({
    summary: '⚖️ Validar capacidad de ruta',
    description: 'Verifica si un conjunto de envíos cabe en un vehículo.',
  })
  @ApiQuery({ name: 'vehicle_id', required: true })
  @ApiQuery({ name: 'shipment_ids', required: true, description: 'IDs separados por coma' })
  async validateCapacity(
    @Query('vehicle_id') vehicleId: string,
    @Query('shipment_ids') shipmentIds: string,
  ) {
    const ids = shipmentIds ? shipmentIds.split(',') : [];
    return this.routesService.validateCapacity(vehicleId, ids);
  }
}
