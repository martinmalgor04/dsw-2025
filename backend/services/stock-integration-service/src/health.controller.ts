import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
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
        service: { type: 'string', example: 'Stock Integration Service' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
      },
    },
  })
  async healthCheck() {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';

    return {
      status: 'ok',
      timestamp,
      service: 'Stock Integration Service',
      version: '1.0.0',
      environment,
    };
  }
}
