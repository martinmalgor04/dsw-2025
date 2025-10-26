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
  @ApiOperation({ summary: 'Crear un nuevo conductor' })
  @ApiResponse({ status: 201, description: 'Conductor creado exitosamente.' })
  async create(@Body() createDriverDto: CreateDriverDto): Promise<Driver> {
    this.logger.log(
      `POST /fleet/drivers - Creando: ${createDriverDto.firstName} ${createDriverDto.lastName}`,
    );
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los conductores' })
  @ApiResponse({ status: 200, description: 'Lista de conductores' })
  async findAll(): Promise<Driver[]> {
    this.logger.log('GET /fleet/drivers - Listando todos');
    return this.driversService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un conductor por ID' })
  @ApiParam({ name: 'id', description: 'ID del conductor' })
  @ApiResponse({ status: 200, description: 'Conductor encontrado' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  async findOne(@Param('id') id: string): Promise<Driver> {
    this.logger.log(`GET /fleet/drivers/${id}`);
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un conductor' })
  @ApiParam({ name: 'id', description: 'ID del conductor' })
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
  @ApiOperation({ summary: 'Eliminar un conductor' })
  @ApiParam({ name: 'id', description: 'ID del conductor' })
  @ApiResponse({ status: 204, description: 'Conductor eliminado' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  async remove(@Param('id') id: string): Promise<Driver> {
    this.logger.log(`DELETE /fleet/drivers/${id}`);
    return this.driversService.remove(id);
  }
}
