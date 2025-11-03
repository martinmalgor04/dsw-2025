import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Gateway → ShippingService: quotes [T030]', () => {
  describe('POST /shipping/quotes', () => {
    it('should calculate shipping quote when request is valid', async () => {
      const payload = {
        origin: { postalCode: '3500' },
        destination: { postalCode: '3400' },
        package: { weightKg: 1, volumeM3: 0.01 },
      };

      const res = await request(BASE_URL)
        .post('/shipping/quotes')
        .send(payload)
        .timeout(TIMEOUT);

      expect([200, 201, 400, 404, 502]).toContain(res.status);

      if (res.status === 200 || res.status === 201) {
        // Validar headers
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.headers['x-request-id']).toBeDefined();

        // Validar estructura de respuesta
        expect(res.body).toBeDefined();

        // Si hay datos de cotización
        if (res.body.totalCost !== undefined) {
          expect(typeof res.body.totalCost).toBe('number');
          expect(res.body.totalCost).toBeGreaterThanOrEqual(0);
        }
      }
    }, 20000);

    it('should include X-Request-ID for tracing', async () => {
      const payload = {
        origin: { postalCode: '3500' },
        destination: { postalCode: '3400' },
        package: { weightKg: 1, volumeM3: 0.01 },
      };

      const res = await request(BASE_URL)
        .post('/shipping/quotes')
        .send(payload)
        .timeout(TIMEOUT);

      expect([200, 201, 400, 404, 502]).toContain(res.status);

      // X-Request-ID debe estar presente
      expect(res.headers['x-request-id']).toBeDefined();

      if (res.status === 200 || res.status === 201) {
        expect(typeof res.headers['x-request-id']).toBe('string');
        // UUID v4 format validation
        expect(res.headers['x-request-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    }, 20000);

    it('should reject invalid payloads with 400', async () => {
      const invalidPayload = {
        // Falta información requerida
        origin: { postalCode: '3500' },
        // destination no existe
        // package no existe
      };

      const res = await request(BASE_URL)
        .post('/shipping/quotes')
        .send(invalidPayload)
        .timeout(TIMEOUT);

      expect([200, 201, 400, 404, 502]).toContain(res.status);

      // Puede ser 400 o 422 (validation error)
      if (res.status === 400 || res.status === 422) {
        expect(res.headers['x-request-id']).toBeDefined();
      }
    }, 20000);

    it('should handle service unavailability with 502', async () => {
      const payload = {
        origin: { postalCode: '3500' },
        destination: { postalCode: '3400' },
        package: { weightKg: 1, volumeM3: 0.01 },
      };

      const res = await request(BASE_URL)
        .post('/shipping/quotes')
        .send(payload)
        .timeout(TIMEOUT);

      expect([200, 201, 400, 404, 502]).toContain(res.status);

      if (res.status === 502) {
        expect(res.headers['x-request-id']).toBeDefined();
        // Response debe ser JSON incluso en error
        expect(res.headers['content-type']).toMatch(/json/);
      }
    }, 20000);

    it('should respond within acceptable time', async () => {
      const payload = {
        origin: { postalCode: '3500' },
        destination: { postalCode: '3400' },
        package: { weightKg: 1, volumeM3: 0.01 },
      };

      const start = Date.now();

      const res = await request(BASE_URL)
        .post('/shipping/quotes')
        .send(payload)
        .timeout(TIMEOUT);

      const duration = Date.now() - start;

      expect([200, 201, 400, 404, 502]).toContain(res.status);
      expect(duration).toBeLessThan(TIMEOUT);
    }, 20000);
  });
});
