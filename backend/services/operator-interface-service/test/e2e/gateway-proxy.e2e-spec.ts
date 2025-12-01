import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtGuard } from '../../src/auth/jwt.guard';
import nock from 'nock';

describe('Gateway Proxy (E2E)', () => {
  let app: INestApplication;
  const SHIPPING_SERVICE_URL = 'http://localhost:3001';

  beforeEach(async () => {
    nock.cleanAll();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should proxy GET requests to Shipping Service', async () => {
    const mockShipment = { id: '123', status: 'CREATED' };

    nock(SHIPPING_SERVICE_URL)
      .get('/shipping/123')
      .reply(200, mockShipment);

    const response = await request(app.getHttpServer())
      .get('/shipping/123')
      .expect(200);

    expect(response.body).toEqual(mockShipment);
  });

  it('should proxy POST requests to Shipping Service', async () => {
    const payload = { origin: 'A', destination: 'B' };
    const responsePayload = { id: '999', status: 'CREATED' };

    nock(SHIPPING_SERVICE_URL)
      .post('/shipping', payload)
      .reply(201, responsePayload);

    const response = await request(app.getHttpServer())
      .post('/shipping')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual(responsePayload);
  });

  it('should return 502 if target service is down', async () => {
    // Si no configuramos nock, la llamada fallará (Connection Refused),
    // lo cual el Gateway captura y transforma en 502 o 500.
    
    await request(app.getHttpServer())
      .get('/shipping/down-endpoint')
      .expect(502);
  });
});

