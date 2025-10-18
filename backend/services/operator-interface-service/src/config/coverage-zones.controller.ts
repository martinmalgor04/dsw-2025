import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  HttpCode, 
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, Length, IsArray, ArrayNotEmpty } from 'class-validator';
import { ConfigService } from './config.service';

// DTOs que coinciden exactamente con la documentación
class CreateCoverageZoneDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  postalCodes: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateCoverageZoneDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  postalCodes?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('config')
@Controller('config/coverage-zones')
export class ConfigCoverageZonesController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas las zonas de cobertura disponibles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de zonas de cobertura',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Buenos Aires Capital' },
          description: { type: 'string', example: 'Capital Federal y zonas aledañas' },
          postalCodes: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['C1000', 'C1001', 'C1002', 'C1003', 'C1004', 'C1005'],
          },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getAllCoverageZones() {
    return this.configService.getAllCoverageZones();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una nueva zona de cobertura' })
  @ApiBody({ type: CreateCoverageZoneDto })
  @ApiResponse({ status: 201, description: 'Zona de cobertura creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createCoverageZone(@Body() createDto: CreateCoverageZoneDto) {
    try {
      return await this.configService.createCoverageZone({
        ...createDto,
        isActive: createDto.isActive ?? true,
      });
    } catch (error: any) {
      throw new BadRequestException('Error al crear zona de cobertura');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una zona de cobertura específica por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la zona de cobertura' })
  @ApiResponse({ status: 200, description: 'Zona de cobertura encontrada' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  async getCoverageZoneById(@Param('id') id: string) {
    try {
      return await this.configService.getCoverageZoneById(id);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Zona de cobertura con ID ${id} no encontrada`);
      }
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una zona de cobertura existente' })
  @ApiParam({ name: 'id', description: 'UUID de la zona de cobertura' })
  @ApiBody({ type: UpdateCoverageZoneDto })
  @ApiResponse({ status: 200, description: 'Zona de cobertura actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  async updateCoverageZone(
    @Param('id') id: string,
    @Body() updateDto: UpdateCoverageZoneDto,
  ) {
    try {
      return await this.configService.updateCoverageZone(id, updateDto);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Zona de cobertura con ID ${id} no encontrada`);
      }
      throw new BadRequestException('Error al actualizar zona de cobertura');
    }
  }
}