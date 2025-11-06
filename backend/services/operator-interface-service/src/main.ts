import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware para generar X-Request-ID en cada request
  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('x-request-id', requestId);
    next();
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration
  // Lee FRONTEND_URL desde .env
  // En desarrollo: http://localhost:3000 o http://localhost:3005
  // En producción Dokploy: http://144.22.130.30:3005 (o la IP asignada)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Operator Interface API Gateway')
    .setDescription(
      'API Gateway y Facade para operadores internos de logística. ' +
        'Proporciona acceso unificado a todos los microservicios del sistema mediante smart proxy routing. ' +
        'Incluye copias locales de endpoints de configuración y enrutamiento automático a servicios backend. ' +
        'Rutas disponibles: /config/*, /shipping/*, /stock/*, /gateway/status',
    )
    .setVersion('1.0.0')
    .setContact(
      'Grupo 12 - UTN FRRE',
      'https://github.com/grupos-12/logistica',
      'grupo12@logistics.com',
    )
    .setLicense('Apache 2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
    .addServer(`http://localhost:${port}`, 'Development Gateway')
    .addTag('config', '⚙️ Gestión de configuración (local)')
    .addTag('gateway', '🌐 Estado del Gateway y Service Registry')
    .addTag('health', '❤️ Health Checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Operator Interface API Gateway - Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3004;
  await app.listen(port);

  console.log(
    `🚀 Operator Interface Service running on http://localhost:${port}`,
  );
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
