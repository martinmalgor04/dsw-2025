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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Shipping Service API')
    .setDescription(
      'Servicio principal de operaciones de envío y logística. ' +
        'Gestiona cotizaciones, creación de envíos, seguimiento y cancelaciones. ' +
        'Incluye cálculo de costos basado en peso volumétrico, distancia y tarifas.',
    )
    .setVersion('1.0.0')
    .setContact(
      'Grupo 12 - UTN FRRE',
      'https://github.com/grupos-12/logistica',
      'grupo12@logistics.com',
    )
    .setLicense('Apache 2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
    .addServer(`http://localhost:${port}`, 'Development Server')
    .addServer('http://localhost:3004/shipping', 'Via API Gateway')
    .addTag('shipping', '📦 Operaciones de envío y cotización')
    .addTag('health', '❤️ Health Checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Shipping Service API - Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Shipping Service running on http://localhost:${port}`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
