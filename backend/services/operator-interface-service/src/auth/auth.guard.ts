import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import JwksClient from 'jwks-rsa';

/**
 * JwtGuard - Valida tokens JWT de Keycloak
 *
 * Este guard:
 * 1. Extrae el token del header Authorization (Bearer token)
 * 2. Obtiene la clave pública del JWKS endpoint de Keycloak
 * 3. Verifica y decodifica el token
 * 4. Valida que el token sea válido y no esté expirado
 * 5. Adjunta el usuario (claims del token) al request para que los controladores lo usen
 *
 * Endpoints excluidos de validación:
 * - /health - Health checks
 * - /api/docs - Documentación Swagger
 * - /gateway/status - Status del gateway
 */
@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);
  private jwksClient: JwksClient.JwksClient;
  private readonly keycloakUrl: string;
  private readonly keycloakRealm: string;
  private readonly skipPaths = ['/health', '/api/', '/gateway/status'];

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>(
      'KEYCLOAK_URL',
      'http://localhost:8080',
    );
    this.keycloakRealm = this.configService.get<string>(
      'KEYCLOAK_REALM',
      'ds-2025-realm',
    );

    // Inicializar cliente JWKS para obtener las claves públicas
    const jwksUri = `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/certs`;
    this.jwksClient = new JwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000, // Cache por 10 minutos
    });

    this.logger.log(
      `JwtGuard inicializado con Keycloak URL: ${this.keycloakUrl}/realms/${this.keycloakRealm}`,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;

    // Saltar validación para rutas públicas
    if (this.skipPaths.some((skipPath) => path.startsWith(skipPath))) {
      return true;
    }

    try {
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        this.logger.warn(`❌ No token provided for ${request.method} ${path}`);
        throw new UnauthorizedException('Token no proporcionado');
      }

      // Decodificar sin validar primero para obtener el kid (key ID)
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        this.logger.warn(`❌ Token inválido para ${request.method} ${path}`);
        throw new UnauthorizedException('Token inválido');
      }

      const { header, payload } = decoded as any;

      // Obtener la clave pública usando el key ID del token
      const key = await this.jwksClient.getSigningKey(header.kid);
      const signingKey = key.getPublicKey();

      // Verificar y decodificar el token con validación completa
      const verified = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer: `${this.keycloakUrl}/realms/${this.keycloakRealm}`,
      }) as any;

      // Adjuntar el usuario (claims del token) al request
      request.user = {
        sub: verified.sub,
        username: verified.preferred_username || verified.sub,
        email: verified.email,
        name: verified.name,
        roles: verified.realm_access?.roles || [],
        scopes: verified.scope?.split(' ') || [],
        clientId: verified.azp,
      };

      this.logger.log(
        `✅ JWT validado para ${verified.preferred_username} - ${request.method} ${path}`,
      );

      return true;
    } catch (error: any) {
      this.logger.error(
        `❌ Error validando JWT para ${request.method} ${path}: ${error.message}`,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Re-lanzar como Unauthorized
      throw new UnauthorizedException(`Acceso denegado: ${error.message}`);
    }
  }

  /**
   * Extrae el token del header Authorization
   * Espera formato: "Bearer <token>"
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme.toLowerCase() !== 'bearer') {
      return undefined;
    }

    return token;
  }
}
