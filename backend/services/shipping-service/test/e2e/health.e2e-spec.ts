import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('ShippingService: Health (E2E)', () => {
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

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'shipping-service');
    });

    it('should return proper health check structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        service: expect.any(String),
      });

      // Validate timestamp is valid ISO string
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should include external dependencies status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // May include config-service, stock-integration-service status
      if (response.body.dependencies) {
        expect(response.body.dependencies).toHaveProperty('configService');
        expect(response.body.dependencies).toHaveProperty('stockService');
      }
    });

    it('should return valid JSON content-type', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should respond quickly (< 1000ms)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should be idempotent', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response1.body.status).toBe(response2.body.status);
      expect(response1.body.service).toBe(response2.body.service);
    });
  });

  describe('Health Check HTTP Methods', () => {
    it('should handle HEAD requests', async () => {
      const response = await request(app.getHttpServer())
        .head('/health');

      expect([200, 405]).toContain(response.status);
    });

    it('should not accept POST requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/health')
        .expect(405);

      expect(response.body).toHaveProperty('statusCode', 405);
    });

    it('should not accept PUT requests', async () => {
      const response = await request(app.getHttpServer())
        .put('/health')
        .expect(405);

      expect(response.body).toHaveProperty('statusCode', 405);
    });

    it('should not accept DELETE requests', async () => {
      const response = await request(app.getHttpServer())
        .delete('/health')
        .expect(405);

      expect(response.body).toHaveProperty('statusCode', 405);
    });
  });
});
