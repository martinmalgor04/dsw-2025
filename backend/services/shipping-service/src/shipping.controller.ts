import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
  PublicShippingTrackingDto,
} from './dto/shipping-responses.dto';
import { UpdateShippingStatusDto } from './dto/update-status.dto';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@ApiTags('📦 Logística - Gestión de Envíos')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('cost')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '💰 Calcular costo de envío',
    description:
      'Calcula el costo total de envío incluyendo productos y transporte',
  })
  @ApiResponse({
    status: 201,
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
    @Query('user_id') userId?: string,
    @Query('userId') userIdCamel?: string,
    @Query('status') status?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ListShippingResponseDto> {
    const resolvedUser = userIdCamel ?? userId;
    return this.shippingService.listShipments({
      userId: resolvedUser,
      status,
      fromDate,
      toDate,
      page,
      limit,
    });
  }

  @Get('track/:trackingNumber')
  @ApiOperation({
    summary: '🔍 Obtener envío por tracking number',
    description:
      'Obtiene información detallada de un envío usando su número de seguimiento',
  })
  @ApiParam({ name: 'trackingNumber', description: 'Número de seguimiento del envío' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del envío obtenido exitosamente',
    type: ShippingDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Envío no encontrado',
  })
  async getShippingByTrackingNumber(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<ShippingDetailDto> {
    return this.shippingService.getShippingByTrackingNumber(trackingNumber);
  }

  @Get('public/track/:trackingNumber')
  @ApiOperation({
    summary: '🔍 Tracking público por número de seguimiento',
    description:
      'Endpoint público para portales de tracking. Devuelve solo estado, dirección de entrega y logs básicos.',
  })
  @ApiParam({
    name: 'trackingNumber',
    description: 'Número de seguimiento del envío',
  })
  @ApiResponse({
    status: 200,
    description: 'Información pública de tracking obtenida exitosamente',
    type: PublicShippingTrackingDto,
  })
  @ApiResponse({ status: 404, description: 'Envío no encontrado' })
  async getPublicTracking(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<PublicShippingTrackingDto> {
    return this.shippingService.getPublicTrackingByTrackingNumber(
      trackingNumber,
    );
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

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔄 Actualizar estado de envío',
    description:
      'Actualiza el estado de un envío y registra el cambio en el historial',
  })
  @ApiParam({ name: 'id', description: 'ID del envío' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    type: ShippingDetailDto,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShippingStatusDto,
  ): Promise<ShippingDetailDto> {
    return this.shippingService.updateStatus(id, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔄 Actualizar envío',
    description:
      'Actualiza un envío. Si se envía { status: "..." }, actualiza el estado y registra el cambio en el historial',
  })
  @ApiParam({ name: 'id', description: 'ID del envío' })
  @ApiResponse({
    status: 200,
    description: 'Envío actualizado exitosamente',
    type: ShippingDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Envío no encontrado',
  })
  async updateShipment(
    @Param('id') id: string,
    @Body() dto: UpdateShippingStatusDto | Partial<CreateShippingRequestDto>,
  ): Promise<ShippingDetailDto> {
    // Si el body tiene 'status', usar updateStatus
    if (dto && typeof dto === 'object' && 'status' in dto) {
      return this.shippingService.updateStatus(id, dto as UpdateShippingStatusDto);
    }
    // Por ahora, solo soportamos actualización de estado
    // En el futuro se puede extender para actualizar otros campos
    throw new BadRequestException('Only status updates are currently supported. Use { status: "..." }');
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
