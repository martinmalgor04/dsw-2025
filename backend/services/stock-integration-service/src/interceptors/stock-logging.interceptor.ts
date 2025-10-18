import { Injectable, Logger, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class StockLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(StockLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const startTime = Date.now();

    this.logger.log({
      message: 'Stock API request started',
      method,
      url,
      body: this.sanitizeBody(body),
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;
          this.logger.log({
            message: 'Stock API request completed',
            method,
            url,
            status: 'success',
            duration,
            responseSize: JSON.stringify(response).length,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            message: 'Stock API request failed',
            method,
            url,
            status: 'error',
            duration,
            error: error.message,
            statusCode: error.response?.status || 'unknown',
            timestamp: new Date().toISOString(),
          });
        },
      })
    );
  }

  /**
   * Sanitiza el body de la request para logging (remueve datos sensibles)
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    
    // Remover campos sensibles
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
