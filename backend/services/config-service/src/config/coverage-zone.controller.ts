import { Controller, Get, Post, Body, Patch, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CoverageZone } from '@logistics/database';
import { CoverageZoneService } from './services/coverage-zone.service';
import { CreateCoverageZoneDto } from './dto/create-coverage-zone.dto';
import { UpdateCoverageZoneDto } from './dto/update-coverage-zone.dto';

@ApiTags('config')
@Controller('config/coverage-zones')
export class CoverageZoneController {
  private readonly logger = new Logger(CoverageZoneController.name);

  constructor(private readonly coverageZoneService: CoverageZoneService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva zona de cobertura' })
  @ApiResponse({
    status: 201,
    description: 'Zona de cobertura creada exitosamente',
  })
  async create(@Body() createCoverageZoneDto: CreateCoverageZoneDto): Promise<CoverageZone> {
    this.logger.log(`POST /config/coverage-zones - Creando: ${createCoverageZoneDto.name}`);
    return this.coverageZoneService.create(createCoverageZoneDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las zonas de cobertura' })
  @ApiResponse({
    status: 200,
    description: 'Lista de zonas de cobertura',
  })
  async findAll(): Promise<CoverageZone[]> {
    this.logger.log('GET /config/coverage-zones - Listando todas');
    return this.coverageZoneService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una zona de cobertura por ID' })
  @ApiParam({ name: 'id', description: 'ID de la zona de cobertura' })
  @ApiResponse({
    status: 200,
    description: 'Zona de cobertura encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Zona de cobertura no encontrada',
  })
  async findOne(@Param('id') id: string): Promise<CoverageZone> {
    this.logger.log(`GET /config/coverage-zones/${id}`);
    return this.coverageZoneService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una zona de cobertura' })
  @ApiParam({ name: 'id', description: 'ID de la zona de cobertura' })
  @ApiResponse({
    status: 200,
    description: 'Zona de cobertura actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Zona de cobertura no encontrada',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCoverageZoneDto: UpdateCoverageZoneDto,
  ): Promise<CoverageZone> {
    this.logger.log(`PATCH /config/coverage-zones/${id}`);
    return this.coverageZoneService.update(id, updateCoverageZoneDto);
  }
}

