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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Obtener puerto antes de usarlo en Swagger
  const port = process.env.PORT || 3003;

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Config Service API')
    .setDescription(
      'Configuration service for transport methods, coverage zones, tariff configurations, and fleet management. ' +
      'This service manages all configuration data for the logistics platform including transport methods, ' +
      'delivery coverage zones, pricing tiers, vehicles, drivers, and delivery routes.',
    )
    .setVersion('1.0.0')
    .setContact(
      'Grupo 12 - UTN FRRE',
      'https://github.com/grupos-12/logistica',
      'grupo12@logistics.com',
    )
    .setLicense('Apache 2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
    .addServer(`http://localhost:${port}`, 'Development')
    .addServer('http://localhost:3004/config', 'Via Gateway')
    .addTag('config', '📦 Configuration - Transport, Zones, and Tariffs')
    .addTag('fleet', '🚚 Fleet - Vehicles, Drivers, and Routes')
    .addTag('health', '❤️ Health Checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelsExpandDepth: 2,
      docExpansion: 'list',
    },
    customCss: `
      .swagger-ui .topbar {
        display: none;
      }
      .swagger-ui .model-toggle:after {
        background-image: none;
      }
    `,
  });
  await app.listen(port);

  console.log(`🚀 Config Service running on http://localhost:${port}`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
