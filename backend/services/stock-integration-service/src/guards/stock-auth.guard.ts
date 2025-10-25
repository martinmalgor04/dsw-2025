import { Injectable, Logger, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StockAuthGuard implements CanActivate {
  private readonly logger = new Logger(StockAuthGuard.name);
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();

  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Obtener token válido
      const token = await this.getValidToken();
      
      // Agregar token a headers de la request
      request.headers['authorization'] = `Bearer ${token}`;
      
      return true;
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new UnauthorizedException('Stock API authentication failed');
    }
  }

  /**
   * Obtiene un token válido (con cache y refresh automático)
   */
  private async getValidToken(): Promise<string> {
    const cacheKey = 'stock-api-token';
    const cached = this.tokenCache.get(cacheKey);

    // Verificar si el token en caché sigue siendo válido
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug('Using cached token');
      return cached.token;
    }

    // Obtener nuevo token
    const token = await this.fetchNewToken();
    
    // Cachear el token (asumimos que expira en 1 hora)
    this.tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hora
    });

    this.logger.log('New token obtained and cached');
    return token;
  }

  /**
   * Obtiene un nuevo token desde Keycloak
   */
  private async fetchNewToken(): Promise<string> {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');
    const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET');
    const grantType = this.configService.get<string>('KEYCLOAK_GRANT_TYPE', 'client_credentials');

    if (!keycloakUrl || !realm || !clientId || !clientSecret) {
      throw new Error('Keycloak configuration is incomplete');
    }

    const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
    
    const params = new URLSearchParams({
      grant_type: grantType,
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`Keycloak token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { access_token?: string };
      
      if (!data.access_token) {
        throw new Error('No access token received from Keycloak');
      }

      return data.access_token;
    } catch (error) {
      this.logger.error('Failed to fetch token from Keycloak', error);
      throw error;
    }
  }

  /**
   * Valida los scopes requeridos
   */
  private validateScopes(token: string, requiredScopes: string[]): boolean {
    // TODO: Implementar validación de scopes JWT
    // Por ahora retornamos true
    this.logger.debug(`Validating scopes: ${requiredScopes.join(', ')}`);
    return true;
  }

  /**
   * Limpia el caché de tokens
   */
  clearTokenCache(): void {
    this.tokenCache.clear();
    this.logger.log('Token cache cleared');
  }
}
