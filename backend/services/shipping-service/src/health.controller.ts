import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Options,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
        service: { type: 'string', example: 'Shipping Service' },
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
      service: 'shipping-service',
      version: '1.0.0',
      environment,
      dependencies: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
        configService: 'unknown',
        stockService: 'unknown',
      },
    };
  }

  private methodNotAllowedResponse() {
    return {
      statusCode: HttpStatus.METHOD_NOT_ALLOWED,
      status: 'method_not_allowed',
      service: 'shipping-service',
      timestamp: new Date().toISOString(),
      message: 'Use GET /health for health status information',
    };
  }

  @Post()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  handlePost() {
    return this.methodNotAllowedResponse();
  }

  @Put()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  handlePut() {
    return this.methodNotAllowedResponse();
  }

  @Patch()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  handlePatch() {
    return this.methodNotAllowedResponse();
  }

  @Delete()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  handleDelete() {
    return this.methodNotAllowedResponse();
  }

  @Options()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  handleOptions() {
    return this.methodNotAllowedResponse();
  }
}
