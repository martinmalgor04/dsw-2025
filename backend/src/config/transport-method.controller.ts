import { Controller, Get, Post, Body, Patch, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  async create(@Body() createTransportMethodDto: CreateTransportMethodDto) {
    this.logger.log(`POST /config/transport-methods - Creando: ${createTransportMethodDto.name}`);
    return this.transportMethodService.create(createTransportMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los métodos de transporte' })
  @ApiResponse({
    status: 200,
    description: 'Lista de métodos de transporte',
  })
  async findAll() {
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
  async findOne(@Param('id') id: string) {
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
  ) {
    this.logger.log(`PATCH /config/transport-methods/${id}`);
    return this.transportMethodService.update(id, updateTransportMethodDto);
  }
}

