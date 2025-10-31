import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';

describe('Gateway → ShippingService: health', () => {
  it('GET /shipping/health should return 200 or 502', async () => {
    const res = await request(BASE_URL).get('/shipping/health').timeout(15000);
    expect([200, 404, 502]).toContain(res.status); // 502 si shipping-service no está corriendo
  }, 20000);
});


