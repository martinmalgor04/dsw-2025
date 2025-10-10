import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('🏠 Sistema - Información General')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: '👋 Mensaje de bienvenida',
    description: 'Endpoint de bienvenida de la API de Logística'
  })
  @ApiResponse({
    status: 200,
    description: 'Mensaje de bienvenida',
    schema: { type: 'string', example: 'Hello World!' }
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: '💚 Health Check',
    description: 'Verifica el estado de salud de la API de Logística'
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de salud de la API',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'Logística API' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' }
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Logística API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
