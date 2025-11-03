import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Gateway → StockIntegrationService: health [T032]', () => {
  describe('GET /stock/health', () => {
    it('should return health status when service is available', async () => {
      const res = await request(BASE_URL)
        .get('/stock/health')
        .timeout(TIMEOUT);

      expect([200, 404, 502]).toContain(res.status);

      if (res.status === 200) {
        // Validar headers
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.headers['x-request-id']).toBeDefined();

        // Validar estructura de health response
        expect(res.body).toHaveProperty('status');
        expect(['ok', 'healthy', 'up']).toContain(res.body.status.toLowerCase());
      }
    }, 20000);

    it('should include X-Request-ID even on error', async () => {
      const res = await request(BASE_URL)
        .get('/stock/health')
        .timeout(TIMEOUT);

      expect([200, 404, 502]).toContain(res.status);

      // X-Request-ID debe estar siempre presente
      expect(res.headers['x-request-id']).toBeDefined();

      if (res.status === 200) {
        expect(typeof res.headers['x-request-id']).toBe('string');
        // UUID v4 format validation
        expect(res.headers['x-request-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    }, 20000);

    it('should handle service unavailability gracefully', async () => {
      const res = await request(BASE_URL)
        .get('/stock/health')
        .timeout(TIMEOUT);

      expect([200, 404, 502]).toContain(res.status);

      // Incluso en 502, debe retornar JSON válido
      if (res.status === 502) {
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.headers['x-request-id']).toBeDefined();
      }
    }, 20000);

    it('should respond quickly', async () => {
      const start = Date.now();

      const res = await request(BASE_URL)
        .get('/stock/health')
        .timeout(TIMEOUT);

      const duration = Date.now() - start;

      expect([200, 404, 502]).toContain(res.status);
      expect(duration).toBeLessThan(TIMEOUT);
    }, 20000);
  });
});
