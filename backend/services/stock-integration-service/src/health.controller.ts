import { Controller, Get, Post, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
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
        service: { type: 'string', example: 'stock-integration-service' },
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
      service: 'stock-integration-service',
      version: '1.0.0',
      environment,
    };
  }

  @Post()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  @ApiOperation({ summary: 'Método no permitido' })
  @ApiResponse({
    status: 405,
    description: 'Method Not Allowed',
  })
  postNotAllowed() {
    return {
      statusCode: 405,
      message: 'Method Not Allowed',
    };
  }

  @Put()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  @ApiOperation({ summary: 'Método no permitido' })
  @ApiResponse({
    status: 405,
    description: 'Method Not Allowed',
  })
  putNotAllowed() {
    return {
      statusCode: 405,
      message: 'Method Not Allowed',
    };
  }

  @Delete()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  @ApiOperation({ summary: 'Método no permitido' })
  @ApiResponse({
    status: 405,
    description: 'Method Not Allowed',
  })
  deleteNotAllowed() {
    return {
      statusCode: 405,
      message: 'Method Not Allowed',
    };
  }
}
