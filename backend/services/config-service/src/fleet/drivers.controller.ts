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
import { Driver } from '@logistics/database';
import { DriversService } from './services/drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@ApiTags('fleet')
@Controller('fleet/drivers')
export class DriversController {
  private readonly logger = new Logger(DriversController.name);

  constructor(private readonly driversService: DriversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo conductor',
    description: 'Registra un nuevo conductor en la flota con información de licencia y contacto'
  })
  @ApiResponse({ status: 201, description: 'Conductor creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async create(@Body() createDriverDto: CreateDriverDto): Promise<Driver> {
    this.logger.log(
      `POST /fleet/drivers - Creando: ${createDriverDto.firstName} ${createDriverDto.lastName}`,
    );
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los conductores',
    description: 'Obtiene la lista completa de conductores registrados'
  })
  @ApiResponse({ status: 200, description: 'Lista de conductores' })
  async findAll(): Promise<Driver[]> {
    this.logger.log('GET /fleet/drivers - Listando todos');
    return this.driversService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un conductor por ID',
    description: 'Recupera los detalles de un conductor específico'
  })
  @ApiParam({ name: 'id', description: 'ID único del conductor' })
  @ApiResponse({ status: 200, description: 'Conductor encontrado' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  async findOne(@Param('id') id: string): Promise<Driver> {
    this.logger.log(`GET /fleet/drivers/${id}`);
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un conductor',
    description: 'Actualiza la información de un conductor existente'
  })
  @ApiParam({ name: 'id', description: 'ID único del conductor' })
  @ApiResponse({ status: 200, description: 'Conductor actualizado' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ): Promise<Driver> {
    this.logger.log(`PATCH /fleet/drivers/${id}`);
    return this.driversService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un conductor',
    description: 'Elimina un conductor del registro'
  })
  @ApiParam({ name: 'id', description: 'ID único del conductor' })
  @ApiResponse({ status: 204, description: 'Conductor eliminado' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  async remove(@Param('id') id: string): Promise<Driver> {
    this.logger.log(`DELETE /fleet/drivers/${id}`);
    return this.driversService.remove(id);
  }
}
