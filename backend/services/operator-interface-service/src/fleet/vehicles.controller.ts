import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpCode, HttpStatus } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Crear un nuevo vehículo' })
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    this.logger.log(`POST /fleet/vehicles - Creando: ${createVehicleDto.license_plate}`);
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los vehículos' })
  async findAll(): Promise<Vehicle[]> {
    this.logger.log('GET /fleet/vehicles - Listando todos');
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async findOne(@Param('id') id: string): Promise<Vehicle> {
    this.logger.log(`GET /fleet/vehicles/${id}`);
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un vehículo' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    this.logger.log(`PATCH /fleet/vehicles/${id}`);
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un vehículo' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async remove(@Param('id') id: string): Promise<Vehicle> {
    this.logger.log(`DELETE /fleet/vehicles/${id}`);
    return this.vehiclesService.remove(id);
  }
}
