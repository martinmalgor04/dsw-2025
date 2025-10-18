import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '@logistics/database';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica el estado del servicio' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del servicio',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'Config Service' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
      },
    },
  })
  async healthCheck() {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';
    
    // Verificar conexión a base de datos
    const databaseHealthy = await this.prisma.healthCheck();
    
    return {
      status: databaseHealthy ? 'ok' : 'unhealthy',
      timestamp,
      service: 'Config Service',
      version: '1.0.0',
      environment,
      dependencies: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
      },
    };
  }
}