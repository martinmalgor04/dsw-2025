import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors();

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('📦 API de Logística - Grupo 12')
    .setDescription(`
      **API de Logística y Transporte** para el proyecto TPI 2025
      
      Esta API proporciona funcionalidades completas para la gestión de envíos y logística:
      
      - 💰 **Cálculo de costos** de envío con productos y distancias
      - 🚚 **Gestión de envíos** con tracking y estados
      - 🚛 **Métodos de transporte** disponibles
      - 📊 **Seguimiento y monitoreo** de envíos
      
      **Desarrollado por:** Grupo 12 - Desarrollo de Software 2025
    `)
    .setVersion('1.0.0')
    .setContact('Grupo 12', 'https://github.com/FRRe-DS/2025-12-TPI', 'grupo12@tpi.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('🏠 Sistema - Información General', 'Endpoints de información general del sistema')
    .addTag('📦 Logística - Gestión de Envíos', 'Operaciones de gestión de envíos y logística')
    .addTag('🚛 Logística - Métodos de Transporte', 'Métodos de transporte disponibles')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: '📦 API Logística - Documentación',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
