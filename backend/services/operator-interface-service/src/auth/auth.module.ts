import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtGuard } from './auth.guard';

/**
 * AuthModule - Módulo de autenticación y autorización
 *
 * Proporciona:
 * - JwtGuard: Guard que valida tokens JWT de Keycloak
 * - Exporta JwtGuard para ser usado globalmente en la app
 */
@Module({
  imports: [ConfigModule],
  providers: [JwtGuard],
  exports: [JwtGuard],
})
export class AuthModule {}
