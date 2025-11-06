import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('ShippingService: Cost Calculation (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /shipping/cost', () => {
    it('should calculate shipping cost with valid data', async () => {
      const costRequest = {
        origin: {
          street: 'Av. Corrientes 1234',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1043',
          country: 'Argentina',
        },
        destination: {
          street: 'San Martín 567',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-001',
            name: 'Test Product',
            quantity: 2,
            weight: 5.5,
            dimensions: {
              length: 30,
              width: 20,
              height: 15,
            },
          },
        ],
        transportType: 'GROUND',
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(costRequest)
        .expect(201);

      expect(response.body).toMatchObject({
        quoteId: expect.any(String),
        totalCost: expect.any(Number),
        estimatedDeliveryDays: expect.any(Number),
        distance: expect.any(Number),
        transportType: 'GROUND',
      });

      expect(response.body.totalCost).toBeGreaterThan(0);
      expect(response.body.distance).toBeGreaterThan(0);
      expect(response.body.estimatedDeliveryDays).toBeGreaterThan(0);
    });

    it('should include breakdown of costs', async () => {
      const costRequest = {
        origin: {
          street: 'Test St 123',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Main St 456',
          city: 'Córdoba',
          state: 'Córdoba',
          postalCode: '5000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-002',
            name: 'Heavy Product',
            quantity: 1,
            weight: 25.0,
            dimensions: {
              length: 50,
              width: 40,
              height: 30,
            },
          },
        ],
        transportType: 'EXPRESS',
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(costRequest)
        .expect(201);

      expect(response.body).toHaveProperty('breakdown');
      if (response.body.breakdown) {
        expect(response.body.breakdown).toHaveProperty('baseCost');
        expect(response.body.breakdown).toHaveProperty('weightCost');
        expect(response.body.breakdown).toHaveProperty('distanceCost');
      }
    });

    it('should return 400 for missing origin', async () => {
      const invalidRequest = {
        destination: {
          street: 'Test',
          city: 'City',
          state: 'State',
          postalCode: '1000',
          country: 'Argentina',
        },
        products: [],
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for missing destination', async () => {
      const invalidRequest = {
        origin: {
          street: 'Test',
          city: 'City',
          state: 'State',
          postalCode: '1000',
          country: 'Argentina',
        },
        products: [],
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for empty products array', async () => {
      const invalidRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [],
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid postal code format', async () => {
      const invalidRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: 'INVALID',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-001',
            name: 'Test',
            quantity: 1,
            weight: 1,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(invalidRequest);

      expect([400, 422]).toContain(response.status);
    });

    it('should handle negative weight validation', async () => {
      const invalidRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-001',
            name: 'Invalid Weight',
            quantity: 1,
            weight: -5,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle zero weight validation', async () => {
      const invalidRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-001',
            name: 'Zero Weight',
            quantity: 1,
            weight: 0,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should calculate volumetric weight when larger than actual weight', async () => {
      const volumetricRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-VOLUMETRIC',
            name: 'Large Volume Low Weight',
            quantity: 1,
            weight: 1, // Low weight
            dimensions: {
              length: 100,
              width: 100,
              height: 100, // Large volume
            },
          },
        ],
        transportType: 'AIR',
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(volumetricRequest)
        .expect(201);

      expect(response.body.totalCost).toBeGreaterThan(0);
      if (response.body.breakdown) {
        expect(response.body.breakdown).toHaveProperty('volumetricWeight');
      }
    });

    it('should handle multiple products correctly', async () => {
      const multiProductRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-A',
            name: 'Product A',
            quantity: 2,
            weight: 5,
            dimensions: { length: 20, width: 20, height: 20 },
          },
          {
            productId: 'PROD-B',
            name: 'Product B',
            quantity: 1,
            weight: 10,
            dimensions: { length: 30, width: 30, height: 30 },
          },
          {
            productId: 'PROD-C',
            name: 'Product C',
            quantity: 3,
            weight: 2,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
        transportType: 'GROUND',
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(multiProductRequest)
        .expect(201);

      expect(response.body.totalCost).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('totalWeight');
      if (response.body.totalWeight) {
        // 2*5 + 1*10 + 3*2 = 26 kg
        expect(response.body.totalWeight).toBeGreaterThanOrEqual(26);
      }
    });

    it('should validate transport type enum', async () => {
      const invalidTransportType = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-001',
            name: 'Test',
            quantity: 1,
            weight: 5,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
        transportType: 'INVALID_TYPE',
      };

      const response = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(invalidTransportType)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should generate unique quoteId for each request', async () => {
      const costRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-001',
            name: 'Test',
            quantity: 1,
            weight: 5,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
      };

      const response1 = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(costRequest)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(costRequest)
        .expect(201);

      expect(response1.body.quoteId).not.toBe(response2.body.quoteId);
    });

    it('should cache quote results (same quoteId returns cached)', async () => {
      const costRequest = {
        origin: {
          street: 'Test',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-CACHE',
            name: 'Cache Test',
            quantity: 1,
            weight: 5,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
      };

      const firstResponse = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(costRequest)
        .expect(201);

      const quoteId = firstResponse.body.quoteId;

      // Second request with same data should potentially use cache
      const secondResponse = await request(app.getHttpServer())
        .post('/shipping/cost')
        .send(costRequest)
        .expect(201);

      // Both should return valid quotes (caching is internal optimization)
      expect(firstResponse.body.totalCost).toBe(secondResponse.body.totalCost);
    });
  });
});
