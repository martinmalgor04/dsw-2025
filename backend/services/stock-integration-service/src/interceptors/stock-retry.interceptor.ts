import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, mergeMap } from 'rxjs/operators';

@Injectable()
export class StockRetryInterceptor {
  private readonly logger = new Logger(StockRetryInterceptor.name);
  private readonly maxRetries: number;
  private readonly baseDelay: number;

  constructor(private configService: ConfigService) {
    this.maxRetries = this.configService.get<number>(
      'STOCK_API_RETRY_ATTEMPTS',
      3,
    );
    this.baseDelay = this.configService.get<number>(
      'STOCK_API_RETRY_DELAY',
      1000,
    );
  }

  /**
   * Interceptor que maneja reintentos automáticos con backoff exponencial
   */
  intercept(context: any, next: any): Observable<any> {
    return next.handle().pipe(
      retry({
        count: this.maxRetries,
        delay: (error, retryCount) => {
          this.logger.warn(
            `Request failed, retrying... (${retryCount}/${this.maxRetries}) - ${error.message}`,
          );

          const delay = this.baseDelay * Math.pow(2, retryCount - 1); // 1s, 2s, 4s
          this.logger.debug(`Waiting ${delay}ms before retry ${retryCount}`);

          return timer(delay);
        },
        resetOnSuccess: true,
      }),
      catchError((error) => {
        this.logger.error(
          `Request failed after ${this.maxRetries} attempts: ${error.message}`,
        );
        return throwError(() => error);
      }),
    );
  }

  /**
   * Verifica si un error debe ser reintentado
   */
  private shouldRetry(error: any): boolean {
    // Reintentar en errores de red, timeouts, y errores 5xx
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      return true;
    }

    // Reintentar en errores HTTP 5xx
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // No reintentar en errores 4xx (excepto 429 - Too Many Requests)
    if (
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      return error.response.status === 429;
    }

    return false;
  }

  /**
   * Calcula el delay para el siguiente reintento usando backoff exponencial
   */
  private calculateDelay(retryCount: number): number {
    return this.baseDelay * Math.pow(2, retryCount - 1);
  }
}
