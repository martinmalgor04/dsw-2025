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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, Min } from 'class-validator';
import { TariffConfig } from '@logistics/database';
import { ConfigService } from './config.service';

// DTOs para Tariff Config
class CreateTariffConfigDto {
  @IsUUID()
  transportMethodId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  minDistance?: number;

  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @IsNumber()
  @Min(0)
  minWeight?: number;

  @IsNumber()
  @Min(0)
  maxWeight?: number;

  @IsNumber()
  @Min(0)
  baseFee: number;

  @IsNumber()
  @Min(0)
  costPerKm?: number;

  @IsNumber()
  @Min(0)
  costPerKg?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateTariffConfigDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minDistance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerKg?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('config')
@Controller('config/tariff-configs')
export class ConfigTariffConfigsController {
  private readonly logger = new Logger(ConfigTariffConfigsController.name);

  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas las configuraciones de tarifa' })
  @ApiQuery({ name: 'transportMethodId', required: false, description: 'Filtrar por método de transporte' })
  @ApiResponse({
    status: 200,
    description: 'Lista de configuraciones de tarifa',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          transportMethodId: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          minDistance: { type: 'number' },
          maxDistance: { type: 'number' },
          minWeight: { type: 'number' },
          maxWeight: { type: 'number' },
          baseFee: { type: 'number' },
          costPerKm: { type: 'number' },
          costPerKg: { type: 'number' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getAllTariffConfigs(@Query('transportMethodId') transportMethodId?: string): Promise<TariffConfig[]> {
    this.logger.log('GET /config/tariff-configs');
    return this.configService.getAllTariffConfigs(transportMethodId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una nueva configuración de tarifa' })
  @ApiBody({ type: CreateTariffConfigDto })
  @ApiResponse({ status: 201, description: 'Configuración de tarifa creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createTariffConfig(@Body() createDto: CreateTariffConfigDto): Promise<TariffConfig> {
    try {
      return await this.configService.createTariffConfig({
        ...createDto,
        isActive: createDto.isActive ?? true,
      });
    } catch (error: any) {
      throw new BadRequestException('Error al crear configuración de tarifa');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una configuración de tarifa específica por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la configuración de tarifa' })
  @ApiResponse({ status: 200, description: 'Configuración de tarifa encontrada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async getTariffConfigById(@Param('id') id: string): Promise<TariffConfig> {
    try {
      return await this.configService.getTariffConfigById(id);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Configuración de tarifa con ID ${id} no encontrada`);
      }
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una configuración de tarifa existente' })
  @ApiParam({ name: 'id', description: 'UUID de la configuración de tarifa' })
  @ApiBody({ type: UpdateTariffConfigDto })
  @ApiResponse({ status: 200, description: 'Configuración de tarifa actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async updateTariffConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateTariffConfigDto,
  ): Promise<TariffConfig> {
    try {
      return await this.configService.updateTariffConfig(id, updateDto);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Configuración de tarifa con ID ${id} no encontrada`);
      }
      throw new BadRequestException('Error al actualizar configuración de tarifa');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una configuración de tarifa' })
  @ApiParam({ name: 'id', description: 'UUID de la configuración de tarifa' })
  @ApiResponse({ status: 204, description: 'Configuración de tarifa eliminada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async deleteTariffConfig(@Param('id') id: string): Promise<void> {
    try {
      await this.configService.deleteTariffConfig(id);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Configuración de tarifa con ID ${id} no encontrada`);
      }
      throw error;
    }
  }
}
