import {
  Controller,
  All,
  Req,
  Res,
  Param,
  Logger,
  BadGatewayException,
  NotFoundException,
  HttpException,
  Next,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ServiceFacade } from './service-facade';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * ProxyController - Smart Proxy Router
 *
 * Actúa como un proxy inteligente que:
 * 1. Recibe ALL requests que no matchean otras rutas
 * 2. Extrae la ruta destino (ej: "/config/transport-methods")
 * 3. Usa ServiceFacade para encontrar el servicio correcto
 * 4. Redirige la request con reintentos automáticos
 * 5. Retorna la respuesta al cliente
 *
 * Rutas soportadas (detectadas automáticamente):
 * - /config/* → config-service
 * - /shipping/* → shipping-service
 * - /stock/* → stock-integration-service
 * - Cualquier nuevo servicio registrado en ServiceRegistry
 *
 * NOTA: Las rutas /health y /api/docs NO son proxied
 * (son manejadas por HealthController y SwaggerModule respectivamente)
 */
@ApiTags('gateway')
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private serviceFacade: ServiceFacade) {}

  /**
   * Endpoint especial para obtener el estado de los servicios
   * Útil para debugging y monitoreo
   */
  @All('/gateway/status')
  @ApiOperation({ summary: 'Get gateway and services status' })
  @ApiResponse({
    status: 200,
    description: 'Gateway status with all registered services',
  })
  getStatus() {
    return this.serviceFacade.getRegistryStatus();
  }

  /**
   * Proxy universal - Captura TODAS las requests no manejadas
   * y las redirige al servicio correcto
   *
   * Nota: Este debe ser el ÚLTIMO controller registrado para que
   * no bloquee otras rutas específicas
   */
  @All('*')
  @ApiOperation({ summary: 'Smart proxy to internal microservices' })
  @ApiResponse({
    status: 200,
    description: 'Response from target microservice',
  })
  @ApiResponse({
    status: 502,
    description: 'Bad gateway - service unavailable',
  })
  @ApiResponse({ status: 404, description: 'Service not found for this route' })
  async proxyRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: any,
  ) {
    const path = req.path;
    const method = req.method.toUpperCase();

    // Excluir rutas que no deben ser proxied - pasar al siguiente handler
    if (path === '/health' || path.startsWith('/api/docs')) {
      return next();
    }

    this.logger.log(`🔄 Proxy: ${method} ${path}`);

    try {
      // Usa el facade para hacer la request al servicio correcto
      const headers = this.enrichHeaders(req);
      const response = await this.serviceFacade.request(
        method,
        path,
        req.body,
        headers,
      );

      // Retorna la respuesta con status 200 (o el que venga del servicio)
      return res.status(200).json(response);
    } catch (error: any) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const response = error.getResponse();
        
        // Solo loguear como error si es 5xx, warnings para 4xx
        if (status >= 500) {
           this.logger.error(`❌ Proxy Error ${status}: ${path}`, JSON.stringify(response));
        } else {
           this.logger.warn(`⚠️ Proxy Client Error ${status}: ${path}`, JSON.stringify(response));
        }
        
        return res.status(status).json(response);
      }

      if (error instanceof NotFoundException) {
        this.logger.warn(`❌ Service not found for route: ${path}`);
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }

      if (error instanceof BadGatewayException) {
        this.logger.error(`❌ Bad gateway: ${path}`, error.message);
        const errorResponse = error.getResponse();
        return res.status(502).json(errorResponse);
      }

      // Error genérico
      this.logger.error(`❌ Unexpected error: ${path}`, error.message);
      return res.status(502).json({
        statusCode: 502,
        message: 'Bad Gateway - Unexpected error',
        error: error.message,
      });
    }
  }

  /**
   * Extrae headers relevantes y añade contexto de usuario
   */
  private enrichHeaders(req: Request): Record<string, string> {
    const relevantHeaders = [
      'authorization',
      'content-type',
      'accept',
      'accept-language',
      'user-agent',
      'x-request-id',
      'x-correlation-id',
    ];

    const filtered: Record<string, string> = {};

    // 1. Copiar headers originales permitidos
    for (const [key, value] of Object.entries(req.headers)) {
      if (relevantHeaders.includes(key.toLowerCase())) {
        filtered[key] = String(value);
      }
    }

    // 2. Inyectar contexto de usuario autenticado (si existe)
    const user = (req as any).user;
    if (user) {
      if (user.sub) filtered['x-user-id'] = user.sub;
      if (user.email) filtered['x-user-email'] = user.email;
      if (user.preferred_username)
        filtered['x-user-username'] = user.preferred_username;
      if (user.scope) filtered['x-user-scope'] = user.scope;
    }

    return filtered;
  }
}
