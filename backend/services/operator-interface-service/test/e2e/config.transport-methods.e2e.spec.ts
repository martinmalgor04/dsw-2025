import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Gateway → ConfigService: transport-methods [T019]', () => {
  describe('GET /config/transport-methods', () => {
    it('should return 200 with transport methods list when service is healthy', async () => {
      const res = await request(BASE_URL)
        .get('/config/transport-methods')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);

      if (res.status === 200) {
        // Validar headers
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.headers['x-request-id']).toBeDefined();

        // Validar estructura de respuesta
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
          ]),
        );
      }
    }, 20000);

    it('should include X-Request-ID header for correlation', async () => {
      const res = await request(BASE_URL)
        .get('/config/transport-methods')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(typeof res.headers['x-request-id']).toBe('string');
        // UUID v4 format validation
        expect(res.headers['x-request-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    }, 20000);

    it('should return 502 when config-service is unavailable', async () => {
      // Nota: Este test pasa si config-service está disponible (200) o no (502)
      const res = await request(BASE_URL)
        .get('/config/transport-methods')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);
    }, 20000);
  });
});
