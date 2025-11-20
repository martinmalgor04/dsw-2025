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
      path === '/'
    ) {
      return true;
    }

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.validateToken(token);
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
    } catch (error) {
      this.logger.error('Token validation failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

