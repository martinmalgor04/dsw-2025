import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Route } from '@logistics/database';
import { RoutesService } from './services/routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@ApiTags('fleet')
@Controller('fleet/routes')
export class RoutesController {
  private readonly logger = new Logger(RoutesController.name);

  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🚛 Crear una nueva ruta',
    description:
      'Crea una nueva ruta de distribución con vehículo, conductor y zona de cobertura asignados',
  })
  @ApiBody({
    type: CreateRouteDto,
    description: 'Datos de la nueva ruta',
    examples: {
      basic: {
        summary: 'Ruta básica',
        value: {
          name: 'Ruta Centro - Zona Norte',
          description: 'Distribución diaria zona norte',
          transportMethodId: '123e4567-e89b-12d3-a456-426614174000',
          vehicleId: '123e4567-e89b-12d3-a456-426614174001',
          driverId: '123e4567-e89b-12d3-a456-426614174002',
          coverageZoneId: '123e4567-e89b-12d3-a456-426614174003',
          startDate: '2024-12-01T08:00:00Z',
          endDate: '2024-12-01T18:00:00Z',
          status: 'PLANNED',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ruta creada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174099',
        name: 'Ruta Centro - Zona Norte',
        description: 'Distribución diaria zona norte',
        transportMethodId: '123e4567-e89b-12d3-a456-426614174000',
        vehicleId: '123e4567-e89b-12d3-a456-426614174001',
        driverId: '123e4567-e89b-12d3-a456-426614174002',
        coverageZoneId: '123e4567-e89b-12d3-a456-426614174003',
        startDate: '2024-12-01T08:00:00.000Z',
        endDate: '2024-12-01T18:00:00.000Z',
        status: 'PLANNED',
        createdAt: '2024-11-06T10:00:00.000Z',
        updatedAt: '2024-11-06T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o falta información requerida',
  })
  @ApiResponse({
    status: 404,
    description:
      'No se encontró el método de transporte, vehículo, conductor o zona de cobertura',
  })
  async create(@Body() createRouteDto: CreateRouteDto): Promise<Route> {
    this.logger.log(`POST /fleet/routes - Creando: ${createRouteDto.name}`);
    return this.routesService.create(createRouteDto);
  }

  @Get()
  @ApiOperation({
    summary: '📋 Listar todas las rutas',
    description:
      'Obtiene todas las rutas con sus relaciones (vehículo, conductor, método de transporte, zona de cobertura)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de rutas obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        example: {
          id: '123e4567-e89b-12d3-a456-426614174099',
          name: 'Ruta Centro - Zona Norte',
          description: 'Distribución diaria zona norte',
          status: 'IN_PROGRESS',
          startDate: '2024-12-01T08:00:00.000Z',
          endDate: '2024-12-01T18:00:00.000Z',
          transportMethod: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            code: 'ground',
            name: 'Terrestre',
          },
          vehicle: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            licensePlate: 'ABC-123',
            brand: 'Mercedes-Benz',
            model: 'Sprinter',
          },
          driver: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            employeeId: 'DRV-001',
            firstName: 'Juan',
            lastName: 'Pérez',
          },
          coverageZone: {
            id: '123e4567-e89b-12d3-a456-426614174003',
            name: 'Zona Norte',
            postalCodes: ['1600', '1601', '1602'],
          },
          createdAt: '2024-11-06T10:00:00.000Z',
          updatedAt: '2024-11-06T10:00:00.000Z',
        },
      },
    },
  })
  async findAll(): Promise<Route[]> {
    this.logger.log('GET /fleet/routes - Listando todas');
    return this.routesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '🔍 Obtener una ruta por ID',
    description:
      'Obtiene los detalles completos de una ruta incluyendo todas sus relaciones y paradas',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la ruta',
    example: '123e4567-e89b-12d3-a456-426614174099',
  })
  @ApiResponse({
    status: 200,
    description: 'Ruta encontrada',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174099',
        name: 'Ruta Centro - Zona Norte',
        description: 'Distribución diaria zona norte',
        status: 'IN_PROGRESS',
        startDate: '2024-12-01T08:00:00.000Z',
        endDate: '2024-12-01T18:00:00.000Z',
        transportMethod: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          code: 'ground',
          name: 'Terrestre',
        },
        vehicle: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          licensePlate: 'ABC-123',
        },
        driver: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          firstName: 'Juan',
          lastName: 'Pérez',
        },
        coverageZone: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: 'Zona Norte',
        },
        stops: [
          {
            id: 'stop-1',
            sequence: 1,
            type: 'PICKUP',
            address: 'Av. Libertador 1234',
          },
          {
            id: 'stop-2',
            sequence: 2,
            type: 'DELIVERY',
            address: 'Av. Cabildo 5678',
          },
        ],
        createdAt: '2024-11-06T10:00:00.000Z',
        updatedAt: '2024-11-06T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido (debe ser un UUID)',
  })
  @ApiResponse({
    status: 404,
    description: 'Ruta no encontrada',
  })
  async findOne(@Param('id') id: string): Promise<Route> {
    this.logger.log(`GET /fleet/routes/${id}`);
    return this.routesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Actualizar una ruta',
    description:
      'Actualiza los datos de una ruta existente (cambio de estado, reasignación de vehículo/conductor, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la ruta',
    example: '123e4567-e89b-12d3-a456-426614174099',
  })
  @ApiBody({
    type: UpdateRouteDto,
    description: 'Datos a actualizar (todos los campos son opcionales)',
    examples: {
      statusChange: {
        summary: 'Cambiar estado',
        value: {
          status: 'IN_PROGRESS',
        },
      },
      reassignDriver: {
        summary: 'Reasignar conductor',
        value: {
          driverId: '123e4567-e89b-12d3-a456-426614174010',
        },
      },
      complete: {
        summary: 'Actualización completa',
        value: {
          name: 'Ruta Centro - Zona Norte (Actualizada)',
          status: 'COMPLETED',
          endDate: '2024-12-01T20:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ruta actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Ruta no encontrada',
  })
  async update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ): Promise<Route> {
    this.logger.log(`PATCH /fleet/routes/${id}`);
    return this.routesService.update(id, updateRouteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🗑️ Eliminar una ruta',
    description:
      'Elimina una ruta del sistema (hard delete). Solo se pueden eliminar rutas en estado PLANNED o CANCELLED',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la ruta',
    example: '123e4567-e89b-12d3-a456-426614174099',
  })
  @ApiResponse({
    status: 200,
    description: 'Ruta eliminada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174099',
        name: 'Ruta Centro - Zona Norte',
        status: 'PLANNED',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar una ruta en estado IN_PROGRESS o COMPLETED',
  })
  @ApiResponse({
    status: 404,
    description: 'Ruta no encontrada',
  })
  async remove(@Param('id') id: string): Promise<Route> {
    this.logger.log(`DELETE /fleet/routes/${id}`);
    return this.routesService.remove(id);
  }
}
