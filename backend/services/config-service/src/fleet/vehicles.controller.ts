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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Vehicle } from '@logistics/database';
import { VehiclesService } from './services/vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiTags('fleet')
@Controller('fleet/vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo vehículo',
    description: 'Registra un nuevo vehículo en la flota con información de matrícula, modelo y capacidad'
  })
  @ApiResponse({
    status: 201,
    description: 'Vehículo creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    this.logger.log(
      `POST /fleet/vehicles - Creando: ${createVehicleDto.license_plate}`,
    );
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los vehículos',
    description: 'Obtiene la lista completa de vehículos registrados en la flota'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vehículos',
  })
  async findAll(): Promise<Vehicle[]> {
    this.logger.log('GET /fleet/vehicles - Listando todos');
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un vehículo por ID',
    description: 'Recupera los detalles de un vehículo específico'
  })
  @ApiParam({ name: 'id', description: 'ID único del vehículo' })
  @ApiResponse({
    status: 200,
    description: 'Vehículo encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Vehículo no encontrado',
  })
  async findOne(@Param('id') id: string): Promise<Vehicle> {
    this.logger.log(`GET /fleet/vehicles/${id}`);
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un vehículo',
    description: 'Actualiza la información de un vehículo existente'
  })
  @ApiParam({ name: 'id', description: 'ID único del vehículo' })
  @ApiResponse({
    status: 200,
    description: 'Vehículo actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Vehículo no encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    this.logger.log(`PATCH /fleet/vehicles/${id}`);
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un vehículo',
    description: 'Elimina un vehículo de la flota'
  })
  @ApiParam({ name: 'id', description: 'ID único del vehículo' })
  @ApiResponse({
    status: 204,
    description: 'Vehículo eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Vehículo no encontrado',
  })
  async remove(@Param('id') id: string): Promise<Vehicle> {
    this.logger.log(`DELETE /fleet/vehicles/${id}`);
    return this.vehiclesService.remove(id);
  }
}
