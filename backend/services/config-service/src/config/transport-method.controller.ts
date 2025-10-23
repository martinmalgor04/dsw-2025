import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransportMethod } from '@logistics/database';
import { TransportMethodService } from './services/transport-method.service';
import { CreateTransportMethodDto } from './dto/create-transport-method.dto';
import { UpdateTransportMethodDto } from './dto/update-transport-method.dto';

@ApiTags('config')
@Controller('config/transport-methods')
export class TransportMethodController {
  private readonly logger = new Logger(TransportMethodController.name);

  constructor(private readonly transportMethodService: TransportMethodService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo método de transporte' })
  @ApiResponse({
    status: 201,
    description: 'Método de transporte creado exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un método con ese código',
  })
  async create(@Body() createTransportMethodDto: CreateTransportMethodDto): Promise<TransportMethod> {
    this.logger.log(`POST /config/transport-methods - Creando: ${createTransportMethodDto.name}`);
    return this.transportMethodService.create(createTransportMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los métodos de transporte' })
  @ApiResponse({
    status: 200,
    description: 'Lista de métodos de transporte',
  })
  async findAll(): Promise<TransportMethod[]> {
    this.logger.log('GET /config/transport-methods - Listando todos');
    return this.transportMethodService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un método de transporte por ID' })
  @ApiParam({ name: 'id', description: 'ID del método de transporte' })
  @ApiResponse({
    status: 200,
    description: 'Método de transporte encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Método de transporte no encontrado',
  })
  async findOne(@Param('id') id: string): Promise<TransportMethod> {
    this.logger.log(`GET /config/transport-methods/${id}`);
    return this.transportMethodService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un método de transporte' })
  @ApiParam({ name: 'id', description: 'ID del método de transporte' })
  @ApiResponse({
    status: 200,
    description: 'Método de transporte actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Método de transporte no encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTransportMethodDto: UpdateTransportMethodDto,
  ): Promise<TransportMethod> {
    this.logger.log(`PATCH /config/transport-methods/${id}`);
    return this.transportMethodService.update(id, updateTransportMethodDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un método de transporte' })
  @ApiParam({ name: 'id', description: 'ID del método de transporte' })
  @ApiResponse({
    status: 204,
    description: 'Método de transporte eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Método de transporte no encontrado',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /config/transport-methods/${id}`);
    return this.transportMethodService.remove(id);
  }
}

