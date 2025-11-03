import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware para generar X-Request-ID en cada request
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

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
    .setTitle('Operator Interface API')
    .setDescription('Internal APIs for logistics operators frontend')
    .setVersion('1.0')
    .addTag('config', 'Configuration management')
    .addTag('health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

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
