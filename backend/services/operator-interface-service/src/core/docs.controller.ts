import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  CreateShippingRequestSchema,
  ShippingDetailSchema,
  TransportMethodSchema,
  RouteSchema,
} from './schemas/public-api.schemas';

/**
 * Documentation Controller
 * Este controlador NO maneja lógica real. Existe solo para exponer los
 * Esquemas de Datos (DTOs) de los microservicios en el Swagger del Gateway.
 * Las peticiones reales son manejadas por el ProxyController.
 */
@Controller('docs-placeholder') 
export class DocsController {
  
  // ==========================================
  // SHIPPING DOCS
  // ==========================================
  @ApiTags('shipping')
  @Post('/shipping')
  @ApiOperation({ 
    summary: 'Create Shipment (Proxy)',
    description: 'Documentación del endpoint proxy hacia Shipping Service. Crea un nuevo envío.' 
  })
  @ApiBody({ type: CreateShippingRequestSchema })
  @ApiResponse({ status: 201, type: ShippingDetailSchema })
  createShipping(@Body() dto: CreateShippingRequestSchema) { return null; }

  @ApiTags('shipping')
  @Get('/shipping/:id')
  @ApiOperation({ 
    summary: 'Get Shipment Details (Proxy)',
    description: 'Obtiene el detalle completo de un envío.' 
  })
  @ApiResponse({ status: 200, type: ShippingDetailSchema })
  getShipping(@Param('id') id: string) { return null; }

  // ==========================================
  // CONFIG DOCS
  // ==========================================
  @ApiTags('config')
  @Get('/config/transport-methods')
  @ApiOperation({ summary: 'List Transport Methods (Proxy)' })
  @ApiResponse({ status: 200, type: [TransportMethodSchema] })
  getTransportMethods() { return null; }

  // ==========================================
  // FLEET DOCS
  // ==========================================
  @ApiTags('fleet')
  @Get('/fleet/routes')
  @ApiOperation({ summary: 'List Routes (Proxy)' })
  @ApiResponse({ status: 200, type: [RouteSchema] })
  getRoutes() { return null; }
}

