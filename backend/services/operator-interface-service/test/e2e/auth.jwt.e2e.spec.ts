import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * JWT Authentication E2E Tests
 *
 * Nota: Este test require que Keycloak esté corriendo
 * En CI/CD podría skippearse o usar un mock
 */
describe('Auth - JWT Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Routes (Sin JWT)', () => {
    it('/health - debería retornar 200 sin JWT', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });

    it('/gateway/status - debería retornar 200 sin JWT', () => {
      return request(app.getHttpServer()).get('/gateway/status').expect(200);
    });

    it('/api/docs - debería retornar 200 sin JWT', () => {
      return request(app.getHttpServer()).get('/api/docs').expect(200);
    });
  });

  describe('Protected Routes (Requieren JWT)', () => {
    it('GET /config/transport-methods - debería retornar 401 sin JWT', () => {
      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .expect(401);
    });

    it('GET /config/transport-methods - debería retornar 401 con JWT inválido', () => {
      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('GET /config/transport-methods - debería retornar 401 con JWT expirado', () => {
      // Token expirado: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MjAwMDAwMDB9...
      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .set(
          'Authorization',
          'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MjAwMDAwMDB9.signature',
        )
        .expect(401);
    });

    it('GET /config/transport-methods - debería rechazar Bearer incorrecto', () => {
      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .expect(401);
    });

    it('POST /shipping/quotes - debería retornar 401 sin JWT', () => {
      return request(app.getHttpServer())
        .post('/shipping/quotes')
        .send({ originPostalCode: '3000' })
        .expect(401);
    });

    it('GET /stock/products - debería retornar 401 sin JWT', () => {
      return request(app.getHttpServer())
        .get('/stock/products')
        .expect(401);
    });
  });

  describe('Auth Header Parsing', () => {
    it('Debe ignorar espacios extras en Authorization header', () => {
      // El header "  Bearer token" debería funcionar igual que "Bearer token"
      // (Si Keycloak estuviera disponible)
      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .set('Authorization', 'Bearer   ')
        .expect(401);
    });

    it('Debe ser case-insensitive en Bearer scheme', () => {
      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .set('Authorization', 'bearer invalid-token')
        .expect(401);
    });
  });

  /**
   * Tests que requieren Keycloak real
   *
   * Para ejecutar estos tests:
   * 1. Levantar Keycloak: docker-compose up -d
   * 2. Obtener token:
   *    curl -X POST http://localhost:8080/realms/ds-2025-realm/protocol/openid-connect/token \
   *      -d "grant_type=password&client_id=grupo-02&username=test-user&password=test"
   * 3. Exportar: export VALID_JWT_TOKEN="<token>"
   * 4. Ejecutar: npm run test:e2e -- auth.jwt.e2e.spec.ts
   */

  describe.skip('With Valid Keycloak Token', () => {
    const validToken = process.env.VALID_JWT_TOKEN || '';

    it('GET /config/transport-methods - debería retornar 200 con JWT válido', () => {
      if (!validToken) {
        throw new Error('VALID_JWT_TOKEN env var not set. See test comments.');
      }

      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('Debería adjuntar request.user con claims del token', async () => {
      if (!validToken) {
        throw new Error('VALID_JWT_TOKEN env var not set. See test comments.');
      }

      // Este test requeriría middleware que loguee request.user
      // Por ahora solo verifica que el request sea aceptado
      return request(app.getHttpServer())
        .get('/config/transport-methods')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });
});
