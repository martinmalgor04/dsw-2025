import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwksClient = require('jwks-rsa');

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private client: any; // jwksClient.JwksClient;

  constructor() {
    const keycloakUrl =
      process.env.KEYCLOAK_URL || 'https://keycloak.mmalgor.com.ar';
    const realm = process.env.KEYCLOAK_REALM || 'ds-2025-realm';
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    this.logger.log(`Initializing JWKS client with URI: ${jwksUri}`);
    this.logger.log(`Keycloak URL from env: ${process.env.KEYCLOAK_URL || 'not set, using default'}`);

    this.client = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 horas
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      requestHeaders: {}, // Headers adicionales si es necesario
      timeout: 30000, // 30 segundos timeout
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        this.logger.error('Token decode failed: token is null or invalid format');
        throw new Error('Invalid token: decode failed');
      }

      const kid = decoded.header.kid;
      if (!kid) {
        this.logger.error('Token missing kid (Key ID) in header');
        throw new Error('Invalid token: missing kid');
      }

      this.logger.debug(`Validating token with kid: ${kid}`);

      let signingKey: string;
      try {
        const key = await this.client.getSigningKey(kid);
        signingKey = key.getPublicKey();
        this.logger.debug('Successfully retrieved signing key from JWKS');
      } catch (jwksError: any) {
        this.logger.error(`Failed to get signing key from JWKS: ${jwksError.message}`);
        this.logger.error(`JWKS URI: ${this.client.options?.jwksUri || 'unknown'}`);
        throw new Error(`Failed to retrieve signing key: ${jwksError.message}`);
      }

      return new Promise((resolve, reject) => {
        jwt.verify(token, signingKey, (err, decodedToken) => {
          if (err) {
            this.logger.error(`Token verification failed: ${err.name} - ${err.message}`);
            if (err.name === 'TokenExpiredError') {
              this.logger.error(`Token expired at: ${new Date((err as any).expiredAt).toISOString()}`);
            }
            reject(err);
          } else {
            this.logger.debug(`Token validated successfully for user: ${(decodedToken as any)?.sub || 'unknown'}`);
            resolve(decodedToken);
          }
        });
      });
    } catch (error: any) {
      this.logger.error(`Token validation error: ${error.message}`, error.stack);
      throw error;
    }
  }
}

