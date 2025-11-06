import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Stock Integration Service API')
    .setDescription(
      'Servicio HTTP interno para integración con el módulo de Stock. ' +
        'Proporciona cliente resiliente con circuit breaker, retry automático y cache Redis. ' +
        'Gestiona consultas de disponibilidad, reservas y sincronización de inventario. ' +
        'Este servicio es consumido internamente por otros microservicios.',
    )
    .setVersion('1.0.0')
    .setContact(
      'Grupo 12 - UTN FRRE',
      'https://github.com/grupos-12/logistica',
      'grupo12@logistics.com',
    )
    .setLicense('Apache 2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
    .addServer(`http://localhost:${port}`, 'Development Server')
    .addServer('http://localhost:3004/stock', 'Via API Gateway')
    .addTag('stock', '📦 Operaciones de integración con Stock')
    .addTag('health', '❤️ Health Checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Stock Integration Service API - Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(
    `🚀 Stock Integration Service running on http://localhost:${port}`,
  );
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
