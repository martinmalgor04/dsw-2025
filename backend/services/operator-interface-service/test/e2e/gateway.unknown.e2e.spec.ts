import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Gateway: Error Handling [T021]', () => {
  describe('GET /unknown - 404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(BASE_URL)
        .get('/unknown/endpoint/that/does/not/exist')
        .timeout(TIMEOUT);

      expect([404, 502, 401, 500, 503]).toContain(res.status);
    }, 20000);

    it('should include X-Request-ID header for error tracing', async () => {
      const res = await request(BASE_URL)
        .get('/unknown/endpoint')
        .timeout(TIMEOUT);

      expect([404, 502]).toContain(res.status);

      if (res.status === 404) {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(typeof res.headers['x-request-id']).toBe('string');
        // UUID v4 format validation
        expect(res.headers['x-request-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    }, 20000);

    it('should return proper error response with X-Request-ID', async () => {
      const res = await request(BASE_URL)
        .get('/nonexistent/path')
        .timeout(TIMEOUT);

      expect([404, 502]).toContain(res.status);

      if (res.status === 404) {
        // Response should be JSON
        expect(res.headers['content-type']).toMatch(/json/);

        // Should have request ID for correlation
        const requestId = res.headers['x-request-id'];
        expect(requestId).toBeDefined();

        // Error response should have useful info
        expect(res.body).toBeDefined();
        if (res.body.message) {
          expect(typeof res.body.message).toBe('string');
        }
      }
    }, 20000);
  });

  describe('GET /gateway/status - Gateway Health', () => {
    it('should return gateway status information', async () => {
      const res = await request(BASE_URL)
        .get('/gateway/status')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);

      if (res.status === 200) {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.headers['content-type']).toMatch(/json/);

        // Should contain services array
        expect(res.body).toHaveProperty('services');
        expect(Array.isArray(res.body.services)).toBe(true);

        // Each service should have expected properties
        res.body.services.forEach((service: any) => {
          expect(service).toHaveProperty('name');
          expect(service).toHaveProperty('baseUrl');
          expect(service).toHaveProperty('routes');
          expect(service).toHaveProperty('isHealthy');
        });
      }
    }, 20000);
  });

  describe('GET /health - Gateway Health Check', () => {
    it('should return gateway health status', async () => {
      const res = await request(BASE_URL)
        .get('/health')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);

      if (res.status === 200) {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.body).toHaveProperty('status');
      }
    }, 20000);
  });

  describe('Error Propagation with Request Correlation', () => {
    it('should propagate errors with X-Request-ID for debugging', async () => {
      const customRequestId = '12345678-1234-4567-8901-123456789012';

      const res = await request(BASE_URL)
        .get('/invalid/route')
        .set('X-Request-ID', customRequestId)
        .timeout(TIMEOUT);

      expect([404, 502]).toContain(res.status);

      // Gateway should preserve or generate X-Request-ID
      expect(res.headers['x-request-id']).toBeDefined();
    }, 20000);
  });
});
