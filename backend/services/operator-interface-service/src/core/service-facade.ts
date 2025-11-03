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
interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  isOpen: boolean;
  openUntil: Date | null;
}

@Injectable()
export class ServiceFacade {
  private readonly logger = new Logger(ServiceFacade.name);
  private readonly maxRetries = 2;
  private readonly initialRetryDelay = 1000; // ms - base para backoff exponencial
  private readonly maxRetryDelay = 10000; // ms - máximo delay entre reintentos
  private readonly circuitBreakerThreshold = 5; // Número de fallas antes de abrir
  private readonly circuitBreakerTimeout = 30000; // ms - tiempo que el circuit breaker permanece abierto
  private readonly defaultTimeout = 10000; // ms - timeout por defecto
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();

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

    // 2. Verifica circuit breaker
    const circuitBreakerKey = `${targetService.name}:${path}`;
    if (this.isCircuitBreakerOpen(circuitBreakerKey)) {
      this.logger.warn(
        `🔴 Circuit breaker OPEN for ${circuitBreakerKey} - rejecting request`,
      );
      throw new BadGatewayException({
        message: `Service ${targetService.name} circuit breaker is open`,
        statusCode: 502,
      });
    }

    // 3. Verifica que el servicio esté saludable
    if (!targetService.isHealthy) {
      this.logger.warn(
        `⚠️  Service ${targetService.name} is unhealthy, but attempting anyway`,
      );
    }

    // 4. Construye la URL del servicio destino
    const targetUrl = `${targetService.baseUrl}${path}`;

    // 5. Timeout configurable por servicio (puede venir de env o configuración)
    const timeout = this.getServiceTimeout(targetService.name);

    // 6. Intenta con reintentos (solo para GET)
    try {
      return await this.requestWithRetry<T>(
        method,
        targetUrl,
        targetService,
        circuitBreakerKey,
        timeout,
        data,
        headers,
      );
    } catch (error) {
      // Registrar falla en circuit breaker
      this.recordFailure(circuitBreakerKey);
      throw error;
    }
  }

  /**
   * Realiza una request con reintentos automáticos
   * Solo reintenta para GET requests con backoff exponencial
   */
  private async requestWithRetry<T>(
    method: string,
    url: string,
    service: RegisteredService,
    circuitBreakerKey: string,
    timeout: number = this.defaultTimeout,
    data?: any,
    headers?: Record<string, string>,
    attempt: number = 0,
  ): Promise<T> {
    try {
      this.logger.debug(
        `📤 ${method} ${url} (attempt ${attempt + 1}/${this.maxRetries + 1}, timeout: ${timeout}ms)`,
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
          timeout,
        })
        .toPromise();

      this.logger.debug(`✅ ${method} ${url} → ${response.status}`);

      // Registrar éxito en circuit breaker (resetea contador)
      this.recordSuccess(circuitBreakerKey);

      return response.data;
    } catch (error: any) {
      const isLastAttempt = attempt >= this.maxRetries;
      const statusCode = error.response?.status;

      // Solo reintentar para GET requests
      const isGet = method.toUpperCase() === 'GET';

      // No reintentar si es error 4xx (excepto 503, 504, 429)
      const retryableStatus = [408, 429, 500, 502, 503, 504];
      const shouldRetry =
        isGet && !isLastAttempt && retryableStatus.includes(statusCode);

      if (shouldRetry) {
        // Backoff exponencial: delay = initialDelay * 2^attempt
        const retryDelay = Math.min(
          this.initialRetryDelay * Math.pow(2, attempt),
          this.maxRetryDelay,
        );

        this.logger.warn(
          `⚠️  GET request failed (${statusCode}), retrying in ${retryDelay}ms...`,
        );

        await this.delay(retryDelay);
        return this.requestWithRetry<T>(
          method,
          url,
          service,
          circuitBreakerKey,
          timeout,
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
   * Obtiene timeout configurable por servicio
   * Puede venir de variables de entorno (ej: CONFIG_SERVICE_TIMEOUT)
   */
  private getServiceTimeout(serviceName: string): number {
    const envKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_TIMEOUT`;
    const envTimeout = process.env[envKey];
    if (envTimeout) {
      return parseInt(envTimeout, 10);
    }
    return this.defaultTimeout;
  }

  /**
   * Verifica si el circuit breaker está abierto para una ruta específica
   */
  private isCircuitBreakerOpen(key: string): boolean {
    const state = this.circuitBreakers.get(key);
    if (!state) {
      return false;
    }

    // Si está abierto, verificar si ya pasó el timeout
    if (state.isOpen && state.openUntil) {
      if (new Date() > state.openUntil) {
        // Timeout expirado, cerrar circuit breaker
        this.logger.debug(
          `🟢 Circuit breaker CLOSED for ${key} - timeout expired`,
        );
        this.circuitBreakers.set(key, {
          failures: 0,
          lastFailure: null,
          isOpen: false,
          openUntil: null,
        });
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Registra una falla en el circuit breaker
   */
  private recordFailure(key: string): void {
    const state = this.circuitBreakers.get(key) || {
      failures: 0,
      lastFailure: null,
      isOpen: false,
      openUntil: null,
    };

    state.failures += 1;
    state.lastFailure = new Date();

    // Si alcanza el umbral, abrir circuit breaker
    if (state.failures >= this.circuitBreakerThreshold) {
      state.isOpen = true;
      state.openUntil = new Date(Date.now() + this.circuitBreakerTimeout);
      this.logger.warn(
        `🔴 Circuit breaker OPENED for ${key} after ${state.failures} failures`,
      );
    }

    this.circuitBreakers.set(key, state);
  }

  /**
   * Registra un éxito en el circuit breaker (resetea contador)
   */
  private recordSuccess(key: string): void {
    const state = this.circuitBreakers.get(key);
    if (state && state.failures > 0) {
      // Resetear contador de fallas en caso de éxito
      this.circuitBreakers.set(key, {
        failures: 0,
        lastFailure: null,
        isOpen: false,
        openUntil: null,
      });
    }
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
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(
        ([key, state]) => ({
          key,
          failures: state.failures,
          isOpen: state.isOpen,
          openUntil: state.openUntil,
        }),
      ),
      timestamp: new Date(),
    };
  }
}
