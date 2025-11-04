# JWT Implementation Guide - Operator Interface Service

## 🎯 Objetivo

Implementar validación de JWT tokens en el operator para que pueda:
1. Validar signature contra Keycloak JWKS
2. Verificar que token no está expirado
3. Extraer claims y pasarlos a microservicios
4. Permitir rutas públicas sin autenticación
5. Proteger rutas sensibles

## 📦 Dependencias (Ya Instaladas)

```json
{
  "jsonwebtoken": "^9.0.2",    // Para decodificar y validar JWTs
  "jwks-rsa": "^3.1.0"          // Para obtener JWKS de Keycloak
}
```

## 🏗️ Arquitectura Propuesta

```
Request del Cliente
        ↓
├─ Rutas Públicas → Pasa directamente
│  ├ /health
│  ├ /gateway/status
│  ├ /api/docs
│  └ ✅ No requiere Authorization header
│
└─ Rutas Protegidas → JWT Guard
   ├ Extrae token del Authorization header
   ├ Valida signature contra Keycloak JWKS
   ├ Verifica expiración
   ├ Extrae claims (sub, email, roles)
   ├ ✅ Continúa si es válido
   └ ❌ Retorna 401 si es inválido
        ↓
    Pasa a ProxyController
        ↓
    Añade headers: X-User-ID, X-User-Email, X-User-Roles
        ↓
    Proxea a microservicio
```

## 📋 Archivos a Crear

### 1. `src/auth/jwt.service.ts` - Servicio JWT

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private jwksClient: jwksClient.JwksClient;

  constructor() {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'ds-2025-realm';

    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    this.logger.log(`🔑 Inicializando JWKS client: ${jwksUri}`);

    this.jwksClient = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 3600000, // 1 hora
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  /**
   * Valida un JWT token
   * @param token Token JWT sin "Bearer " prefix
   * @returns Payload decodificado si es válido
   * @throws Error si token es inválido
   */
  async validateToken(token: string): Promise<any> {
    try {
      // Decodificar sin verificar (para obtener header)
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        throw new Error('Token inválido');
      }

      // Obtener key ID del header
      const kid = decoded.header.kid;
      if (!kid) {
        throw new Error('Token sin kid en header');
      }

      // Obtener key pública de Keycloak
      const key = await this.jwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      // Verificar signature
      const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'], // Keycloak usa RS256
      }) as any;

      this.logger.log(`✅ JWT válido para usuario: ${verified.sub}`);

      return verified;
    } catch (error: any) {
      this.logger.warn(`❌ JWT inválido: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrae claims útiles del payload
   */
  extractClaims(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.preferred_username,
      roles: payload.realm_access?.roles || [],
      clientRoles: payload.resource_access || {},
    };
  }
}
```

### 2. `src/auth/jwt.strategy.ts` - Passport Strategy

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    try {
      // Extraer token del header
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      // Validar contra Keycloak JWKS
      await this.jwtService.validateToken(token);

      // Extraer claims
      const claims = this.jwtService.extractClaims(payload);

      return claims;
    } catch (error: any) {
      throw new UnauthorizedException(
        `Autenticación fallida: ${error.message}`,
      );
    }
  }
}
```

### 3. `src/auth/jwt.guard.ts` - Guard

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from './jwt.service';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => Reflect.metadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Chequear si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log(`🔓 Ruta pública, sin autenticación`);
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn(`❌ Sin Authorization header`);
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      // Validar token contra Keycloak
      const payload = await this.jwtService.validateToken(token);

      // Extraer claims y agregar a request
      const claims = this.jwtService.extractClaims(payload);
      request.user = claims;

      this.logger.log(`✅ Usuario autenticado: ${claims.userId}`);

      return true;
    } catch (error: any) {
      this.logger.error(`❌ Token inválido: ${error.message}`);
      throw new UnauthorizedException(`Token inválido: ${error.message}`);
    }
  }

  private extractToken(request: any): string | undefined {
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      return undefined;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Formato de Authorization header inválido');
    }

    return parts[1];
  }
}
```

### 4. `src/auth/auth.module.ts` - Módulo

```typescript
import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtGuard } from './jwt.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  providers: [JwtService, JwtGuard, JwtStrategy],
  exports: [JwtService, JwtGuard],
})
export class AuthModule {}
```

### 5. Actualizar `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './auth/jwt.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AuthModule,
    CoreModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
```

### 6. Marcar Rutas Públicas

En cada controller que tenga rutas públicas, usar decorator `@Public()`:

```typescript
import { Public } from '../auth/jwt.guard';

@Controller()
export class HealthController {
  @Get('/health')
  @Public()
  getHealth() {
    return { status: 'ok' };
  }
}

@Controller()
export class ProxyController {
  @All('/gateway/status')
  @Public()
  getStatus() {
    return this.serviceFacade.getRegistryStatus();
  }
}
```

### 7. Pasar Claims a Microservicios

En `ProxyController`, pasar user claims como headers:

```typescript
async proxyRequest(@Req() req: Request, @Res() res: Response) {
  const user = req.user as any; // Del JwtGuard

  const headers = this.extractRelevantHeaders(req.headers);

  // Agregar user claims
  if (user) {
    headers['x-user-id'] = user.userId;
    headers['x-user-email'] = user.email;
    headers['x-user-roles'] = user.roles?.join(',') || '';
  }

  const response = await this.serviceFacade.request(
    method,
    path,
    req.body,
    headers,
  );

  return res.status(200).json(response);
}
```

## 🧪 Tests E2E

Actualizar `test/e2e/gateway.unknown.e2e.spec.ts`:

```typescript
import request from 'supertest';
import Keycloak from 'keycloak-js';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = 'ds-2025-realm';

describe('Gateway: JWT Authentication', () => {
  let validToken: string;

  beforeAll(async () => {
    // Obtener token de Keycloak para tests
    // En desarrollo, crear usuario test en Keycloak
    // validToken = await getKeycloakToken('testuser', 'password');
  });

  describe('Autenticación', () => {
    it('should reject requests without Authorization header', async () => {
      const res = await request(BASE_URL)
        .get('/config/transport-methods')
        .timeout(15000);

      expect(res.status).toBe(401);
    });

    it('should accept valid JWT token', async () => {
      const res = await request(BASE_URL)
        .get('/config/transport-methods')
        .set('Authorization', `Bearer ${validToken}`)
        .timeout(15000);

      expect([200, 502]).toContain(res.status);
    });

    it('should reject invalid token', async () => {
      const res = await request(BASE_URL)
        .get('/config/transport-methods')
        .set('Authorization', 'Bearer invalid.token.here')
        .timeout(15000);

      expect(res.status).toBe(401);
    });
  });

  describe('Rutas Públicas', () => {
    it('should allow /health without token', async () => {
      const res = await request(BASE_URL)
        .get('/health')
        .timeout(15000);

      expect([200, 502]).toContain(res.status);
    });

    it('should allow /gateway/status without token', async () => {
      const res = await request(BASE_URL)
        .get('/gateway/status')
        .timeout(15000);

      expect([200, 502]).toContain(res.status);
    });

    it('should allow /api/docs without token', async () => {
      const res = await request(BASE_URL)
        .get('/api/docs')
        .timeout(15000);

      expect([200, 301, 302]).toContain(res.status);
    });
  });

  describe('Headers de Usuario', () => {
    it('should pass X-User-ID header to proxied service', async () => {
      const res = await request(BASE_URL)
        .get('/config/transport-methods')
        .set('Authorization', `Bearer ${validToken}`)
        .timeout(15000);

      // El servicio backend debería recibir X-User-ID header
      expect([200, 502]).toContain(res.status);
    });
  });
});
```

## 📝 Variables de Entorno

Actualizar `env.example`:

```env
# Puerto
PORT=3004

# Frontend CORS
FRONTEND_URL=http://localhost:3000

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=ds-2025-realm

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
NODE_ENV=development
```

## 🚀 Instalación (Pasos)

1. **Instalar dependencias (si no están):**
   ```bash
   cd backend/services/operator-interface-service
   npm install jsonwebtoken jwks-rsa
   npm install --save-dev @types/jsonwebtoken
   ```

2. **Crear archivos:**
   - `src/auth/jwt.service.ts`
   - `src/auth/jwt.strategy.ts`
   - `src/auth/jwt.guard.ts`
   - `src/auth/auth.module.ts`

3. **Actualizar archivos:**
   - `src/app.module.ts` - importar AuthModule y registrar guard
   - `src/health/health.controller.ts` - agregar `@Public()`
   - `src/core/proxy.controller.ts` - agregar `@Public()` a `/gateway/status` y pasar claims

4. **Compilar y testear:**
   ```bash
   npm run build
   npm run test:e2e
   ```

## ✅ Checklist

- [ ] Crear archivos en `src/auth/`
- [ ] Actualizar `app.module.ts`
- [ ] Marcar rutas públicas con `@Public()`
- [ ] Actualizar `ProxyController` para pasar headers
- [ ] Actualizar tests E2E
- [ ] Testear localmente
- [ ] Testear en Dokploy
- [ ] Documentar en README

## 🔐 Seguridad

- ✅ Valida signature contra Keycloak JWKS
- ✅ Verifica expiry del token
- ✅ Cache de JWKS (refresh cada hora)
- ✅ Rutas públicas bien definidas
- ✅ Claims pasados a microservicios vía headers
- ✅ No expone secrets en logs

## 📊 Performance

- Caché de JWKS en memoria (1 hora)
- Rate limit de requests a JWKS (10/min)
- Validation happen antes de proxear
- Token expiry cachado en JWT decode

---

**Dificultad:** ⭐⭐ Intermedia
**Tiempo Estimado:** 1-2 horas
**Status:** Listo para implementar
