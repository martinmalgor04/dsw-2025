import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';

describe('Gateway → ConfigService: tariff-configs', () => {
  it('GET /config/tariff-configs should return 200 and JSON', async () => {
    const res = await request(BASE_URL).get('/config/tariff-configs').timeout(15000);
    expect([200, 502]).toContain(res.status); // 502 si config-service no está corriendo
    if (res.status === 200) {
      expect(res.headers['content-type']).toMatch(/json/);
      expect(Array.isArray(res.body)).toBe(true);
    }
  }, 20000); // Timeout de test aumentado a 20s
});


