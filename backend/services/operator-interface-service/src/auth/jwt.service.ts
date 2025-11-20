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
      process.env.KEYCLOAK_URL || 'http://keycloak.mmalgor.com.ar';
    const realm = process.env.KEYCLOAK_REALM || 'ds-2025-realm';
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    this.logger.log(`Initializing JWKS client with URI: ${jwksUri}`);

    this.client = jwksClient({
      jwksUri,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async validateToken(token: string): Promise<any> {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const kid = decoded.header.kid;
    const key = await this.client.getSigningKey(kid);
    const signingKey = key.getPublicKey();

    return new Promise((resolve, reject) => {
      jwt.verify(token, signingKey, (err, decodedToken) => {
        if (err) {
          reject(err);
        } else {
          resolve(decodedToken);
        }
      });
    });
  }
}

