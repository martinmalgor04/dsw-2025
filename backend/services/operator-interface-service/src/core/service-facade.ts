import {
  Injectable,
  Logger,
  BadGatewayException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ServiceRegistry, RegisteredService } from './service-registry';

/**
 * ServiceFacade - Facade Pattern Implementation
 *
 * Propósito:
 * - Oculta la complejidad de múltiples servicios detrás de una interfaz simple
 * - Rutea requests al servicio apropiado automáticamente
 * - Maneja reintentos y fallover si un servicio cae
 * - Transforma errores de forma consistente
 *
 * Ventajas:
 * - Frontend habla con UN solo servicio (simpleza)
 * - Agregar nuevos servicios NO requiere cambios en frontend
 * - Servicios internos pueden cambiar sin afectar el API público
 */
@Injectable()
export class ServiceFacade {
  private readonly logger = new Logger(ServiceFacade.name);
  private readonly maxRetries = 2;
  private readonly retryDelay = 1000; // ms

  constructor(
    private serviceRegistry: ServiceRegistry,
    private httpService: HttpService,
  ) {}

  /**
   * Realiza una request HTTP a través del facade
   *
   * @param method GET, POST, PATCH, DELETE, etc
   * @param path La ruta solicitada (ej: /config/transport-methods)
   * @param data Datos para POST/PATCH
   * @param headers Headers adicionales
   * @returns Respuesta del servicio destino
   */
  async request<T>(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    // 1. Encuentra el servicio responsable de esta ruta
    const targetService = this.serviceRegistry.findServiceByRoute(path);

    if (!targetService) {
      this.logger.warn(`❌ No service found for route: ${path}`);
      throw new NotFoundException(`No service found for route: ${path}`);
    }

    // 2. Verifica que el servicio esté saludable
    if (!targetService.isHealthy) {
      this.logger.warn(
        `⚠️  Service ${targetService.name} is unhealthy, but attempting anyway`,
      );
    }

    // 3. Construye la URL del servicio destino
    const targetUrl = `${targetService.baseUrl}${path}`;

    // 4. Intenta con reintentos
    return this.requestWithRetry<T>(
      method,
      targetUrl,
      targetService,
      data,
      headers,
    );
  }

  /**
   * Realiza una request con reintentos automáticos
   */
  private async requestWithRetry<T>(
    method: string,
    url: string,
    service: RegisteredService,
    data?: any,
    headers?: Record<string, string>,
    attempt: number = 0,
  ): Promise<T> {
    try {
      this.logger.debug(
        `📤 ${method} ${url} (attempt ${attempt + 1}/${this.maxRetries + 1})`,
      );

      const response = await this.httpService
        .request<T>({
          method,
          url,
          data,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          timeout: 10000,
        })
        .toPromise();

      this.logger.debug(`✅ ${method} ${url} → ${response.status}`);
      return response.data;
    } catch (error: any) {
      const isLastAttempt = attempt >= this.maxRetries;
      const statusCode = error.response?.status;

      // No reintentar si es error 4xx (excepto 503, 504, 429)
      const retryableStatus = [408, 429, 500, 502, 503, 504];
      const shouldRetry =
        !isLastAttempt && retryableStatus.includes(statusCode);

      if (shouldRetry) {
        this.logger.warn(
          `⚠️  Request failed (${statusCode}), retrying in ${this.retryDelay}ms...`,
        );

        await this.delay(this.retryDelay);
        return this.requestWithRetry<T>(
          method,
          url,
          service,
          data,
          headers,
          attempt + 1,
        );
      }

      // Si es el último intento, marca el servicio como no saludable
      if (isLastAttempt) {
        this.serviceRegistry.markServiceUnhealthy(service.name);
      }

      this.logger.error(
        `❌ ${method} ${url} → ${statusCode || 'ERROR'}`,
        error.message,
      );

      // Transforma el error a un formato estándar
      throw new BadGatewayException({
        message: `Service ${service.name} failed`,
        originalError: error.message,
        statusCode: statusCode || 502,
      });
    }
  }

  /**
   * Utility para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtiene información sobre todos los servicios registrados
   * Útil para debugging y monitoreo
   */
  getRegistryStatus() {
    return {
      services: this.serviceRegistry.getAllServices().map((s) => ({
        name: s.name,
        baseUrl: s.baseUrl,
        routes: s.routes,
        isHealthy: s.isHealthy,
        lastHealthCheck: s.lastHealthCheck,
      })),
      timestamp: new Date(),
    };
  }
}
