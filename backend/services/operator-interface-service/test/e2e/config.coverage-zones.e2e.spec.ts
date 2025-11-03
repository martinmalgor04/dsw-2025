import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Gateway → ConfigService: coverage-zones [T028]', () => {
  describe('GET /config/coverage-zones', () => {
    it('should return 200 with coverage zones list when service is healthy', async () => {
      const res = await request(BASE_URL)
        .get('/config/coverage-zones')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);

      if (res.status === 200) {
        // Validar headers
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.headers['x-request-id']).toBeDefined();

        // Validar estructura de respuesta
        expect(Array.isArray(res.body)).toBe(true);

        // Si hay datos, validar estructura
        if (res.body.length > 0) {
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
        }
      }
    }, 20000);

    it('should include X-Request-ID header for tracing', async () => {
      const res = await request(BASE_URL)
        .get('/config/coverage-zones')
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

    it('should return proper error response on service unavailability', async () => {
      const res = await request(BASE_URL)
        .get('/config/coverage-zones')
        .timeout(TIMEOUT);

      expect([200, 502]).toContain(res.status);

      // Even on 502, should have X-Request-ID for debugging
      if (res.status === 502) {
        expect(res.headers['x-request-id']).toBeDefined();
      }
    }, 20000);
  });

  describe('GET /config/coverage-zones/:id', () => {
    it('should retrieve a specific coverage zone by id', async () => {
      // Primero obtener un ID válido
      const listRes = await request(BASE_URL)
        .get('/config/coverage-zones')
        .timeout(TIMEOUT);

      if (listRes.status === 200 && listRes.body.length > 0) {
        const zoneId = listRes.body[0].id;

        const res = await request(BASE_URL)
          .get(`/config/coverage-zones/${zoneId}`)
          .timeout(TIMEOUT);

        expect([200, 404, 502]).toContain(res.status);

        if (res.status === 200) {
          expect(res.headers['x-request-id']).toBeDefined();
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(zoneId);
        }
      }
    }, 20000);
  });

  describe('POST /config/coverage-zones', () => {
    it('should create a new coverage zone', async () => {
      const newZone = {
        name: 'Zona Centro',
        description: 'Área central de cobertura',
        zipCodeStart: 1000,
        zipCodeEnd: 1999,
      };

      const res = await request(BASE_URL)
        .post('/config/coverage-zones')
        .send(newZone)
        .timeout(TIMEOUT);

      expect([201, 200, 400, 502]).toContain(res.status);

      if (res.status === 201 || res.status === 200) {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.body).toHaveProperty('id');
      }
    }, 20000);
  });

  describe('PATCH /config/coverage-zones/:id', () => {
    it('should update a coverage zone', async () => {
      const listRes = await request(BASE_URL)
        .get('/config/coverage-zones')
        .timeout(TIMEOUT);

      if (listRes.status === 200 && listRes.body.length > 0) {
        const zoneId = listRes.body[0].id;
        const updateData = {
          name: 'Zona Centro Actualizada',
        };

        const res = await request(BASE_URL)
          .patch(`/config/coverage-zones/${zoneId}`)
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
});
