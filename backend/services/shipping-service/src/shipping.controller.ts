import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import {
  CalculateCostRequestDto,
  CalculateCostResponseDto,
} from './dto/calculate-cost.dto';
import {
  CreateShippingRequestDto,
  CreateShippingResponseDto,
} from './dto/create-shipping.dto';
import {
  ShippingDetailDto,
  ListShippingResponseDto,
  CancelShippingResponseDto,
} from './dto/shipping-responses.dto';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@ApiTags('📦 Logística - Gestión de Envíos')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('cost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '💰 Calcular costo de envío',
    description:
      'Calcula el costo total de envío incluyendo productos y transporte',
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo de costo exitoso',
    type: CalculateCostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async calculateCost(
    @Body() body: CalculateCostRequestDto,
  ): Promise<CalculateCostResponseDto> {
    return this.shippingService.calculateCost(body);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🚚 Crear envío',
    description:
      'Crea un nuevo envío con tracking number y estimación de entrega',
  })
  @ApiResponse({
    status: 201,
    description: 'Envío creado exitosamente',
    type: CreateShippingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o productos no disponibles',
  })
  async createShipping(
    @Body() body: CreateShippingRequestDto,
  ): Promise<CreateShippingResponseDto> {
    return this.shippingService.createShipping(body);
  }

  @Get('transport-methods')
  @ApiOperation({
    summary: '🚢 Obtener métodos de transporte disponibles',
    description: 'Retorna la lista de métodos de transporte que pueden usarse para envíos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de métodos de transporte',
    type: TransportMethodsResponseDto,
  })
  async getTransportMethods(): Promise<TransportMethodsResponseDto> {
    return this.shippingService.getTransportMethods();
  }

  @Get()
  @ApiOperation({
    summary: '📋 Listar envíos',
    description: 'Obtiene una lista paginada de envíos con filtros opcionales',
  })
  @ApiQuery({ name: 'user_id', required: false, description: 'ID del usuario' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Estado del envío',
  })
  @ApiQuery({
    name: 'from_date',
    required: false,
    description: 'Fecha desde (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to_date',
    required: false,
    description: 'Fecha hasta (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Elementos por página',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de envíos obtenida exitosamente',
    type: ListShippingResponseDto,
  })
  async listShipments(
    @Query('user_id') userId?: number,
    @Query('status') status?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ListShippingResponseDto> {
    return this.shippingService.listShipments({
      userId,
      status,
      fromDate,
      toDate,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: '🔍 Obtener detalle de envío',
    description:
      'Obtiene información detallada de un envío específico incluyendo historial',
  })
  @ApiParam({ name: 'id', description: 'ID del envío' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del envío obtenido exitosamente',
    type: ShippingDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Envío no encontrado',
  })
  async getShippingDetail(@Param('id') id: string): Promise<ShippingDetailDto> {
    return this.shippingService.getShippingDetail(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '❌ Cancelar envío',
    description: 'Cancela un envío que esté en estado CREATED o RESERVED',
  })
  @ApiParam({ name: 'id', description: 'ID del envío a cancelar' })
  @ApiResponse({
    status: 200,
    description: 'Envío cancelado exitosamente',
    type: CancelShippingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El envío no puede ser cancelado en su estado actual',
  })
  @ApiResponse({
    status: 404,
    description: 'Envío no encontrado',
  })
  async cancelShipping(
    @Param('id') id: string,
  ): Promise<CancelShippingResponseDto> {
    return this.shippingService.cancelShipping(id);
  }
}
