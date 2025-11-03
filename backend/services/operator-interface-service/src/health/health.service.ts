import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

/**
 * HealthService - Gateway Health Check
 *
 * NOTA IMPORTANTE: Este es el health check del GATEWAY, no debe acceder a BD directamente.
 * El gateway simplemente reporta su propio estado.
 * Los health checks de los microservicios se hacen en ServiceRegistry.
 */
@Injectable()
export class HealthService {
  constructor(private readonly configService: NestConfigService) {}

  async getHealthStatus() {
    const timestamp = new Date().toISOString();
    const environment = this.configService.get('NODE_ENV', 'development');

    return {
      status: 'ok',
      timestamp,
      service: 'Operator Interface Gateway',
      version: '1.0.0',
      environment,
      note: 'Gateway is running. Microservice health checks are performed separately.',
    };
  }
}
