import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import nock from 'nock';

describe('StockIntegrationService (E2E) - Products', () => {
  let app: INestApplication;
  const STOCK_API_URL = 'https://comprasg5.mmalgor.com.ar';

  beforeEach(async () => {
    nock.cleanAll();
    
    // Configurar variable de entorno para que el servicio use la URL que vamos a mockear
    process.env.STOCK_API_URL = STOCK_API_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    await app.close();
    nock.restore();
  });

  it('/stock/productos (GET) should return products from external API', async () => {
    const mockData = [
      {
        id: 1,
        nombre: 'Televisor',
        precio: 50000,
        stockDisponible: 10,
        pesoKg: 5.5,
        dimensiones: {
          altoCm: 0,
          anchoCm: 0,
          largoCm: 0,
        },
        ubicacion: {
          city: 'Sin ciudad',
          country: 'Argentina',
          postal_code: 'H0000AAA',
          state: 'Sin provincia',
          street: 'Sin calle',
        },
      },
    ];

    // Mockear tanto con /v1 como sin /v1 por si el servicio agrega el prefijo
    nock(STOCK_API_URL).get('/productos').reply(200, mockData);
    nock(STOCK_API_URL).get('/v1/productos').reply(200, mockData);

    const response = await request(app.getHttpServer())
      .get('/stock/productos')
      .expect(200);

    expect(response.body).toEqual(mockData);
  });

  it('/stock/productos/:id (GET) should return single product', async () => {
    const mockProduct = {
      id: 99,
      nombre: 'Smartphone',
      precio: 80000,
      stockDisponible: 5,
      pesoKg: 0.2,
      dimensiones: {
        altoCm: 0,
        anchoCm: 0,
        largoCm: 0,
      },
      ubicacion: {
        city: 'Sin ciudad',
        country: 'Argentina',
        postal_code: 'H0000AAA',
        state: 'Sin provincia',
        street: 'Sin calle',
      },
    };

    // Mockear tanto con /v1 como sin /v1
    nock(STOCK_API_URL).get('/productos/99').reply(200, mockProduct);
    nock(STOCK_API_URL).get('/v1/productos/99').reply(200, mockProduct);

    const response = await request(app.getHttpServer())
      .get('/stock/productos/99')
      .expect(200);

    expect(response.body).toEqual(mockProduct);
  });
});

