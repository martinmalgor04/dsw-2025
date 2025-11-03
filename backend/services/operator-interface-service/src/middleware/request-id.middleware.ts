import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * RequestIdMiddleware - Genera UUID único para cada request
 *
 * Uso: Tracing distribuido a través de microservicios
 * Header: X-Request-ID
 * Valor: UUID v4
 *
 * Beneficios:
 * - Correlacionar logs entre servicios
 * - Debuggear requests complejas
 * - Rastrear errores en arquitectura distribuida
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Generar o usar X-Request-ID existente
    const requestId = req.headers['x-request-id'] || randomUUID();

    // Agregarlo al request para uso en la aplicación
    (req as any).id = requestId;

    // Agregarlo a la respuesta
    res.setHeader('X-Request-ID', requestId);

    // Log opcional
    this.logger.debug(`Request ID: ${requestId} - ${req.method} ${req.path}`);

    next();
  }
}
