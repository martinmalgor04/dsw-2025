import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import {
  ExternalTrackingRequestDto,
  ExternalTrackingResponseDto,
} from './dto/external-tracking.dto';
import { CreateShippingRequestDto } from './dto/create-shipping.dto';
import { TransportType } from './enums/transport-type.enum';

@ApiTags('📦 Integración Compras - Tracking')
@Controller('api/logistics/tracking')
export class TrackingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear tracking (Integration with Compras)',
    description: 'Endpoint para que el módulo de Compras cree un envío/tracking',
  })
  @ApiResponse({
    status: 201,
    description: 'Tracking creado exitosamente',
    type: ExternalTrackingResponseDto,
  })
  async createTracking(
    @Body() body: ExternalTrackingRequestDto,
  ): Promise<ExternalTrackingResponseDto> {
    // Adaptar request externa a interna
    // NOTA: La API de Compras envía una dirección como string y no envía ID de usuario ni tipo de transporte.
    // Asumimos valores por defecto para compatibilidad.
    
    // Simplificación de dirección para cumplir con el DTO interno
    const addressParts = body.address.split(',');
    const street = addressParts[0] || body.address;
    const city = addressParts[1]?.trim() || 'Unknown';
    
    // ID de usuario genérico para pedidos de Compras si no se provee
    const DEFAULT_USER_ID = 9999; 
    
    const createDto: CreateShippingRequestDto = {
      order_id: body.orderId,
      user_id: DEFAULT_USER_ID, 
      delivery_address: {
        street: street,
        city: city,
        state: 'Unknown', // Default
        postal_code: 'C1000ABC', // Default válido para pasar validación CPA si no se provee
        country: 'AR',
      },
      transport_type: TransportType.ROAD, // Default
      products: body.products.map((p: any) => ({
        id: p.productId || p.id, // Adaptar según venga
        quantity: p.quantity || 1,
      })),
    };

    try {
      const shipment = await this.shippingService.createShipping(createDto);

      return {
        id: shipment.shipping_id, // UUID string
        status: shipment.status,
        orderId: body.orderId,
        creationDate: new Date().toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener tracking (Integration with Compras)',
    description: 'Endpoint para que el módulo de Compras consulte un tracking',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del tracking',
    type: ExternalTrackingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tracking no encontrado' })
  async getTracking(
    @Param('id') id: string,
  ): Promise<ExternalTrackingResponseDto> {
    try {
      // Intentar buscar por ID (que es UUID en nuestro sistema)
      const shipment = await this.shippingService.getShippingDetail(id);

      return {
        id: shipment.shipping_id,
        status: shipment.status,
        orderId: shipment.order_id,
        creationDate: shipment.created_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Tracking no encontrado');
      }
      throw error;
    }
  }
}

