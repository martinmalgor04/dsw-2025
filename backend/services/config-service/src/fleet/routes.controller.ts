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
import { Route } from '@logistics/database';
import { RoutesService } from './services/routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@ApiTags('fleet')
@Controller('fleet/routes')
export class RoutesController {
  private readonly logger = new Logger(RoutesController.name);

  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva ruta' })
  async create(@Body() createRouteDto: CreateRouteDto): Promise<Route> {
    this.logger.log(`POST /fleet/routes - Creando: ${createRouteDto.name}`);
    return this.routesService.create(createRouteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las rutas' })
  async findAll(): Promise<Route[]> {
    this.logger.log('GET /fleet/routes - Listando todas');
    return this.routesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ruta por ID' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  async findOne(@Param('id') id: string): Promise<Route> {
    this.logger.log(`GET /fleet/routes/${id}`);
    return this.routesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ruta' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  async update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ): Promise<Route> {
    this.logger.log(`PATCH /fleet/routes/${id}`);
    return this.routesService.update(id, updateRouteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una ruta' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  async remove(@Param('id') id: string): Promise<Route> {
    this.logger.log(`DELETE /fleet/routes/${id}`);
    return this.routesService.remove(id);
  }
}
