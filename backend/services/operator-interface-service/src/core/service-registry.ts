import { Injectable, Logger } from '@nestjs/common';

/**
 * Representa un servicio registrado en la arquitectura
 */
export interface RegisteredService {
  name: string;
  baseUrl: string;
  routes: string[]; // ej: ['/config', '/shipping']
  healthCheckUrl: string;
  isHealthy: boolean;
  lastHealthCheck: Date | null;
}

/**
 * ServiceRegistry - Service Discovery
 * Mantiene un registro dinámico de todos los microservicios disponibles
 *
 * Ventajas:
 * - Descubrimiento automático de servicios
 * - Health checks periódicos
 * - Fallback en caso de que un servicio caiga
 * - Fácil agregar nuevos servicios sin cambiar código
 */
@Injectable()
export class ServiceRegistry {
  private readonly logger = new Logger(ServiceRegistry.name);
  private services = new Map<string, RegisteredService>();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeServices();
  }

  /**
   * Inicializa los servicios conocidos
   * En un escenario real, esto vendría de:
   * - Variables de entorno
   * - Consul, Eureka, etcd
   * - Kubernetes service discovery
   */
  private initializeServices() {
    const baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost';

    const servicesConfig = [
      {
        name: 'config-service',
        baseUrl: `${baseUrl}:3003`,
        routes: ['/config'],
        healthCheckUrl: '/health',
      },
      {
        name: 'shipping-service',
        baseUrl: `${baseUrl}:3001`,
        routes: ['/shipping'],
        healthCheckUrl: '/health',
      },
      {
        name: 'stock-integration-service',
        baseUrl: `${baseUrl}:3002`,
        routes: ['/stock'],
        healthCheckUrl: '/health',
      },
    ];

    for (const config of servicesConfig) {
      this.registerService(
        config.name,
        config.baseUrl,
        config.routes,
        config.healthCheckUrl,
      );
    }

    this.logger.log(`✅ Registered ${this.services.size} services`);
    this.startHealthChecks();
  }

  /**
   * Registra un nuevo servicio en el registry
   */
  registerService(
    name: string,
    baseUrl: string,
    routes: string[],
    healthCheckUrl: string,
  ): void {
    this.services.set(name, {
      name,
      baseUrl,
      routes,
      healthCheckUrl,
      isHealthy: true,
      lastHealthCheck: null,
    });

    this.logger.log(`📝 Registered service: ${name} at ${baseUrl}`);
  }

  /**
   * Obtiene un servicio por nombre
   */
  getService(name: string): RegisteredService | undefined {
    return this.services.get(name);
  }

  /**
   * Encuentra el servicio responsable de una ruta
   * Ej: "/config/transport-methods" → retorna config-service
   */
  findServiceByRoute(path: string): RegisteredService | undefined {
    // Extrae el prefijo de la ruta (ej: "/config" de "/config/transport-methods")
    const routePrefix = '/' + path.split('/')[1];

    for (const service of this.services.values()) {
      if (service.routes.includes(routePrefix)) {
        return service;
      }
    }

    return undefined;
  }

  /**
   * Obtiene todos los servicios registrados
   */
  getAllServices(): RegisteredService[] {
    return Array.from(this.services.values());
  }

  /**
   * Inicia chequeos de salud periódicos
   */
  private startHealthChecks(): void {
    // Health check cada 30 segundos
    this.healthCheckInterval = setInterval(() => {
      this.checkAllServicesHealth();
    }, 30000);

    // Primera ejecución inmediata
    this.checkAllServicesHealth();
  }

  /**
   * Verifica la salud de todos los servicios
   */
  private async checkAllServicesHealth(): Promise<void> {
    for (const service of this.services.values()) {
      try {
        const url = `${service.baseUrl}${service.healthCheckUrl}`;
        const response = await this.fetchWithTimeout(url, 5000);

        service.isHealthy = response.ok;
        service.lastHealthCheck = new Date();

        const status = service.isHealthy ? '✅' : '❌';
        this.logger.debug(`${status} ${service.name} health check`);
      } catch (error) {
        service.isHealthy = false;
        service.lastHealthCheck = new Date();
        this.logger.warn(`❌ ${service.name} health check failed: ${error}`);
      }
    }
  }

  /**
   * Utility para hacer fetch con timeout
   */
  private fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    return Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs),
      ),
    ]);
  }

  /**
   * Marca un servicio como no saludable
   */
  markServiceUnhealthy(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (service) {
      service.isHealthy = false;
      this.logger.warn(`⚠️  Service marked as unhealthy: ${serviceName}`);
    }
  }

  /**
   * Limpia los recursos (llamar en onModuleDestroy)
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
