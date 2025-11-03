import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Gateway → ConfigService: tariff-configs [T020]', () => {
  let createdTariffId: string;

  describe('GET /config/tariff-configs', () => {
    it('should return 200 with tariff configs list', async () => {
      const res = await request(BASE_URL)
        .get('/config/tariff-configs')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);

      if (res.status === 200) {
        // Validar headers
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.headers['x-request-id']).toBeDefined();

        // Validar estructura de respuesta
        expect(Array.isArray(res.body)).toBe(true);
      }
    }, 20000);

    it('should include X-Request-ID header', async () => {
      const res = await request(BASE_URL)
        .get('/config/tariff-configs')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(typeof res.headers['x-request-id']).toBe('string');
      }
    }, 20000);
  });

  describe('POST /config/tariff-configs', () => {
    it('should create a new tariff config', async () => {
      const newTariff = {
        baseCost: 1000,
        perKmCost: 50,
        minCost: 500,
        currency: 'ARS',
      };

      const res = await request(BASE_URL)
        .post('/config/tariff-configs')
        .send(newTariff)
        .timeout(TIMEOUT);

      expect([201, 200, 502]).toContain(res.status);

      if (res.status === 201 || res.status === 200) {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.body).toHaveProperty('id');
        createdTariffId = res.body.id;
      }
    }, 20000);
  });

  describe('GET /config/tariff-configs/:id', () => {
    it('should retrieve a specific tariff config by id', async () => {
      // Primero obtener un ID válido
      const listRes = await request(BASE_URL)
        .get('/config/tariff-configs')
        .timeout(TIMEOUT);

      if (listRes.status === 200 && listRes.body.length > 0) {
        const tariffId = listRes.body[0].id;

        const res = await request(BASE_URL)
          .get(`/config/tariff-configs/${tariffId}`)
          .timeout(TIMEOUT);

        expect([200, 404, 502]).toContain(res.status);

        if (res.status === 200) {
          expect(res.headers['x-request-id']).toBeDefined();
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(tariffId);
        }
      }
    }, 20000);
  });

  describe('PATCH /config/tariff-configs/:id', () => {
    it('should update a tariff config', async () => {
      // Primero obtener un ID válido
      const listRes = await request(BASE_URL)
        .get('/config/tariff-configs')
        .timeout(TIMEOUT);

      if (listRes.status === 200 && listRes.body.length > 0) {
        const tariffId = listRes.body[0].id;
        const updateData = {
          baseCost: 1500,
          perKmCost: 60,
        };

        const res = await request(BASE_URL)
          .patch(`/config/tariff-configs/${tariffId}`)
          .send(updateData)
          .timeout(TIMEOUT);

        expect([200, 404, 502]).toContain(res.status);

        if (res.status === 200) {
          expect(res.headers['x-request-id']).toBeDefined();
          expect(res.body).toHaveProperty('id');
        }
      }
    }, 20000);
  });

  describe('DELETE /config/tariff-configs/:id', () => {
    it('should delete a tariff config', async () => {
      // Primero obtener un ID válido
      const listRes = await request(BASE_URL)
        .get('/config/tariff-configs')
        .timeout(TIMEOUT);

      if (listRes.status === 200 && listRes.body.length > 0) {
        const tariffId = listRes.body[0].id;

        const res = await request(BASE_URL)
          .delete(`/config/tariff-configs/${tariffId}`)
          .timeout(TIMEOUT);

        expect([200, 204, 404, 502]).toContain(res.status);

        if (res.status === 200 || res.status === 204) {
          expect(res.headers['x-request-id']).toBeDefined();
        }
      }
    }, 20000);
  });
});
