import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TariffConfig } from '@logistics/database';
import { TariffConfigService } from './services/tariff-config.service';
import { CreateTariffConfigDto } from './dto/create-tariff-config.dto';
import { UpdateTariffConfigDto } from './dto/update-tariff-config.dto';

@ApiTags('config')
@Controller('config/tariff-configs')
export class TariffConfigController {
  private readonly logger = new Logger(TariffConfigController.name);

  constructor(private readonly tariffConfigService: TariffConfigService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva configuración de tarifa' })
  @ApiResponse({
    status: 201,
    description: 'Configuración de tarifa creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async create(
    @Body() createTariffConfigDto: CreateTariffConfigDto,
  ): Promise<TariffConfig> {
    this.logger.log(
      `POST /config/tariff-configs - Creando para método: ${createTariffConfigDto.transportMethodId}`,
    );
    return this.tariffConfigService.create(createTariffConfigDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las configuraciones de tarifa' })
  @ApiQuery({
    name: 'transportMethodId',
    required: false,
    description: 'Filtrar por método de transporte',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de configuraciones de tarifa',
  })
  async findAll(
    @Query('transportMethodId') transportMethodId?: string,
  ): Promise<TariffConfig[]> {
    this.logger.log('GET /config/tariff-configs - Listando todas');

    if (transportMethodId) {
      return this.tariffConfigService.findByTransportMethod(transportMethodId);
    }

    return this.tariffConfigService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una configuración de tarifa por ID' })
  @ApiParam({ name: 'id', description: 'ID de la configuración de tarifa' })
  @ApiResponse({
    status: 200,
    description: 'Configuración de tarifa encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración de tarifa no encontrada',
  })
  async findOne(@Param('id') id: string): Promise<TariffConfig> {
    this.logger.log(`GET /config/tariff-configs/${id}`);
    return this.tariffConfigService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una configuración de tarifa' })
  @ApiParam({ name: 'id', description: 'ID de la configuración de tarifa' })
  @ApiResponse({
    status: 200,
    description: 'Configuración de tarifa actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración de tarifa no encontrada',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTariffConfigDto: UpdateTariffConfigDto,
  ): Promise<TariffConfig> {
    this.logger.log(`PATCH /config/tariff-configs/${id}`);
    return this.tariffConfigService.update(id, updateTariffConfigDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una configuración de tarifa' })
  @ApiParam({ name: 'id', description: 'ID de la configuración de tarifa' })
  @ApiResponse({
    status: 204,
    description: 'Configuración de tarifa eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración de tarifa no encontrada',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /config/tariff-configs/${id}`);
    return this.tariffConfigService.remove(id);
  }
}
