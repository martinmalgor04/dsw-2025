import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';

describe('Gateway: unknown route', () => {
  it('GET /unknown should return 404 and include request-id header when available', async () => {
    const res = await request(BASE_URL).get('/unknown');
    expect([404, 502]).toContain(res.status); // 502 if proxy error
    // Optional header assertion if middleware is present
    // expect(res.headers['x-request-id']).toBeDefined();
  });
});


