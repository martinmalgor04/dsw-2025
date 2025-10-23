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
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Length, Min } from 'class-validator';
import { TransportMethod } from '@logistics/database';
import { ConfigService } from './config.service';

// DTOs que coinciden exactamente con la documentación
class CreateTransportMethodDto {
  @IsString()
  @Length(2, 20)
  code: string;

  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  averageSpeed: number;

  @IsString()
  @Length(1, 20)
  estimatedDays: string;

  @IsNumber()
  @Min(0)
  baseCostPerKm: number;

  @IsNumber()
  @Min(0)
  baseCostPerKg: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateTransportMethodDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  averageSpeed?: number;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  estimatedDays?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseCostPerKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseCostPerKg?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('config')
@Controller('config/transport-methods')
export class ConfigTransportMethodsController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos los métodos de transporte disponibles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de métodos de transporte',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'air' },
          name: { type: 'string', example: 'Aéreo' },
          description: { type: 'string', example: 'Transporte aéreo para envíos urgentes' },
          averageSpeed: { type: 'number', example: 800 },
          estimatedDays: { type: 'string', example: '1-3' },
          baseCostPerKm: { type: 'string', example: '0.80' },
          baseCostPerKg: { type: 'string', example: '5.00' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          tariffConfigs: { type: 'array', items: {} },
        },
      },
    },
  })
  async getAllTransportMethods(): Promise<TransportMethod[]> {
    return this.configService.getAllTransportMethods();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo método de transporte' })
  @ApiBody({ type: CreateTransportMethodDto })
  @ApiResponse({ status: 201, description: 'Método de transporte creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Código ya existe' })
  async createTransportMethod(@Body() createDto: CreateTransportMethodDto): Promise<TransportMethod> {
    try {
      return await this.configService.createTransportMethod({
        ...createDto,
        isActive: createDto.isActive ?? true,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Ya existe un método de transporte con el código ${createDto.code}`);
      }
      throw new BadRequestException('Error al crear método de transporte');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un método de transporte específico por ID' })
  @ApiParam({ name: 'id', description: 'UUID del método de transporte' })
  @ApiResponse({ status: 200, description: 'Método de transporte encontrado' })
  @ApiResponse({ status: 404, description: 'Método no encontrado' })
  async getTransportMethodById(@Param('id') id: string): Promise<TransportMethod> {
    try {
      return await this.configService.getTransportMethodById(id);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Método de transporte con ID ${id} no encontrado`);
      }
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un método de transporte existente' })
  @ApiParam({ name: 'id', description: 'UUID del método de transporte' })
  @ApiBody({ type: UpdateTransportMethodDto })
  @ApiResponse({ status: 200, description: 'Método de transporte actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Método no encontrado' })
  async updateTransportMethod(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransportMethodDto,
  ): Promise<TransportMethod> {
    try {
      return await this.configService.updateTransportMethod(id, updateDto);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Método de transporte con ID ${id} no encontrado`);
      }
      throw new BadRequestException('Error al actualizar método de transporte');
    }
  }
}