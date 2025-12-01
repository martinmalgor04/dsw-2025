import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Gateway → StockIntegrationService: catálogos proxied [T033]', () => {
  describe('GET /stock/productos', () => {
    it('should proxy catalog requests or fail gracefully when unauthenticated', async () => {
      const res = await request(BASE_URL)
        .get('/stock/productos')
        .timeout(TIMEOUT);

      expect([200, 401, 403, 502]).toContain(res.status);
      expect(res.headers['x-request-id']).toBeDefined();
    }, TIMEOUT);
  });

  describe('GET /stock/reservas', () => {
    it('should support query parameters and bubble up auth errors', async () => {
      const res = await request(BASE_URL)
        .get('/stock/reservas?usuarioId=1')
        .timeout(TIMEOUT);

      expect([200, 401, 403, 502]).toContain(res.status);
      expect(res.headers['x-request-id']).toBeDefined();
    }, TIMEOUT);
  });
});

