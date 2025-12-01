import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from './jwt.service';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { SCOPES_KEY } from './decorators/scopes.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Excepciones de rutas públicas globales
    const path = request.path;
    if (
      path.startsWith('/api/docs') ||
      path.startsWith('/health') ||
      path === '/gateway/status' ||
      path === '/' ||
      // Rutas de stock/productos pueden ser públicas (catalogo público)
      path.startsWith('/stock/productos') ||
      path.startsWith('/stock/reservas') ||
      // Endpoint público de tracking para clientes
      path.startsWith('/shipping/public/track')
    ) {
      return true;
    }

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn(`No token provided for path: ${path}`);
      this.logger.debug(`Request headers: ${JSON.stringify(request.headers)}`);
      throw new UnauthorizedException('No token provided');
    }

    this.logger.debug(`Validating token for path: ${path}, token length: ${token.length}`);

    try {
      const payload = await this.jwtService.validateToken(token);
      this.logger.debug(`Token validated successfully for user: ${payload.sub || 'unknown'}`);
      request['user'] = payload;

      // Check scopes
      const requiredScopes = this.reflector.getAllAndOverride<string[]>(
        SCOPES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredScopes && requiredScopes.length > 0) {
        // Keycloak stores scopes in 'scope' claim as space-separated string
        const tokenScopes = payload.scope ? payload.scope.split(' ') : [];
        const hasScope = requiredScopes.some((scope) =>
          tokenScopes.includes(scope),
        );
        if (!hasScope) {
          this.logger.warn(
            `User ${payload.sub} missing required scopes: ${requiredScopes.join(', ')}`,
          );
          throw new UnauthorizedException('Insufficient permissions');
        }
      }

      return true;
    } catch (error: any) {
      this.logger.error(`Token validation failed for path: ${path}`);
      this.logger.error(`Error type: ${error.name || 'Unknown'}`);
      this.logger.error(`Error message: ${error.message || 'No message'}`);
      
      // Si es un error de expiración, dar un mensaje más específico
      if (error.name === 'TokenExpiredError') {
        this.logger.error(`Token expired at: ${new Date(error.expiredAt).toISOString()}`);
        throw new UnauthorizedException('Token expired');
      }
      
      // Si es un error de JWKS, dar un mensaje más específico
      if (error.message?.includes('signing key') || error.message?.includes('JWKS')) {
        this.logger.error('Failed to retrieve signing key from Keycloak JWKS endpoint');
        throw new UnauthorizedException('Authentication service unavailable');
      }
      
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

