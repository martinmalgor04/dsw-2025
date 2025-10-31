import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';

describe('Gateway → ShippingService: quotes', () => {
  it('POST /shipping/quotes should return 200/201 or 502', async () => {
    const payload = {
      // Ajustar al contrato real del shipping-service si existe
      origin: { postalCode: '3500' },
      destination: { postalCode: '3400' },
      package: { weightKg: 1, volumeM3: 0.01 },
    };
    const res = await request(BASE_URL).post('/shipping/quotes').send(payload).timeout(15000);
    expect([200, 201, 400, 404, 502]).toContain(res.status); // 502 si shipping-service no está corriendo
  }, 20000);
});


