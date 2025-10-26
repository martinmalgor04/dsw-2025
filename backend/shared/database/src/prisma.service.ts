import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Usar directamente process.env para compatibilidad con Docker
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['info', 'warn', 'error'],
    });

    this.logger.log(
      `Connecting to database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`,
    );
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error);
    }
  }

  /**
   * Health check para verificar conexión a la base de datos
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Limpiar datos para testing
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be used in test environment');
    }

    // Eliminar en orden correcto para respetar foreign keys
    await this.routeStop.deleteMany();
    await this.route.deleteMany();
    await this.vehicle.deleteMany();
    await this.driver.deleteMany();
    await this.tariffConfig.deleteMany();
    await this.transportMethod.deleteMany();
    await this.coverageZone.deleteMany();

    this.logger.log('Database cleaned for testing');
  }
}
