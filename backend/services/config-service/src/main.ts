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
  // En desarrollo: acepta localhost
  // En producción: acepta la URL del frontend desde FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const corsOrigin = frontendUrl.includes('localhost')
    ? [/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, 'http://localhost:3005', 'http://localhost:3000']
    : [frontendUrl, /^https?:\/\/.*:3005$/];

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Config Service API')
    .setDescription(
      'Configuration service for transport methods, coverage zones and tariff configurations',
    )
    .setVersion('1.0')
    .addTag('transport-methods', 'Transport methods management')
    .addTag('coverage-zones', 'Coverage zones management')
    .addTag('tariff-configs', 'Tariff configurations management')
    .addTag('health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);

  console.log(`🚀 Config Service running on http://localhost:${port}`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
