import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PrismaService } from '@logistics/database';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: NestConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getHealthStatus() {
    const timestamp = new Date().toISOString();
    const environment = this.configService.get('NODE_ENV', 'development');

    // Verificar conexión a base de datos
    const databaseHealthy = await this.prisma.healthCheck();

    return {
      status: databaseHealthy ? 'ok' : 'unhealthy',
      timestamp,
      service: 'Logística API',
      version: '1.0.0',
      environment,
      dependencies: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
      },
    };
  }
}
