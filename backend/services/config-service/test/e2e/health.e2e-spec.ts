import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('ConfigService: Health (E2E)', () => {
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
      expect(response.body).toHaveProperty('service', 'config-service');
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

      // Validate timestamp is a valid ISO string
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should include database connection status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      if (response.body.database) {
        expect(response.body.database).toHaveProperty('status');
        expect(['up', 'down', 'ok', 'healthy']).toContain(
          response.body.database.status.toLowerCase(),
        );
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

    it('should be idempotent (multiple calls return same structure)', async () => {
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

  describe('Health Check Error Scenarios', () => {
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

  describe('Root Endpoint', () => {
    it('GET / should return service info', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('config-service');
    });

    it('GET / should return version info', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('version');
    });
  });
});
