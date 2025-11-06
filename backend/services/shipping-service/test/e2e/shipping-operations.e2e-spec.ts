import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('ShippingService: Operations (E2E)', () => {
  let app: INestApplication;
  let createdShipmentId: string;

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

  describe('POST /shipping', () => {
    it('should create a new shipment with valid data', async () => {
      const newShipment = {
        userId: 'user-e2e-test-001',
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
        .post('/shipping')
        .send(newShipment)
        .expect(201);

      expect(response.body).toMatchObject({
        shipmentId: expect.any(String),
        userId: newShipment.userId,
        status: expect.any(String),
        trackingNumber: expect.any(String),
        estimatedDeliveryDate: expect.any(String),
        totalCost: expect.any(Number),
      });

      expect(['PENDING', 'CREATED', 'PROCESSING']).toContain(response.body.status);
      createdShipmentId = response.body.shipmentId;
    });

    it('should return 400 for missing required fields', async () => {
      const invalidShipment = {
        userId: 'user-test',
        // Missing origin, destination, products
      };

      const response = await request(app.getHttpServer())
        .post('/shipping')
        .send(invalidShipment)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should generate unique tracking number', async () => {
      const shipment1 = {
        userId: 'user-unique-test',
        origin: {
          street: 'Test St',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: '1000',
          country: 'Argentina',
        },
        destination: {
          street: 'Test St',
          city: 'Rosario',
          state: 'Santa Fe',
          postalCode: '2000',
          country: 'Argentina',
        },
        products: [
          {
            productId: 'PROD-UNIQUE',
            name: 'Unique Test',
            quantity: 1,
            weight: 2,
            dimensions: { length: 10, width: 10, height: 10 },
          },
        ],
      };

      const response1 = await request(app.getHttpServer())
        .post('/shipping')
        .send(shipment1)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/shipping')
        .send(shipment1)
        .expect(201);

      expect(response1.body.trackingNumber).not.toBe(response2.body.trackingNumber);
    });
  });

  describe('GET /shipping', () => {
    it('should return list of shipments', async () => {
      const response = await request(app.getHttpServer())
        .get('/shipping')
        .expect(200);

      expect(response.body).toHaveProperty('shipments');
      expect(Array.isArray(response.body.shipments)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('should filter by userId', async () => {
      const userId = 'user-filter-test';

      // Create a shipment for this user first
      await request(app.getHttpServer())
        .post('/shipping')
        .send({
          userId,
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
              productId: 'PROD-FILTER',
              name: 'Filter Test',
              quantity: 1,
              weight: 1,
              dimensions: { length: 10, width: 10, height: 10 },
            },
          ],
        });

      const response = await request(app.getHttpServer())
        .get(`/shipping?user_id=${userId}`)
        .expect(200);

      expect(response.body.shipments.length).toBeGreaterThan(0);
      response.body.shipments.forEach((shipment: any) => {
        expect(shipment.userId).toBe(userId);
      });
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/shipping?status=PENDING')
        .expect(200);

      if (response.body.shipments.length > 0) {
        response.body.shipments.forEach((shipment: any) => {
          expect(shipment.status).toBe('PENDING');
        });
      }
    });

    it('should paginate results', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/shipping?page=1&limit=5')
        .expect(200);

      expect(page1.body.page).toBe(1);
      expect(page1.body.limit).toBe(5);
      expect(page1.body.shipments.length).toBeLessThanOrEqual(5);
    });

    it('should filter by date range', async () => {
      const fromDate = '2024-01-01';
      const toDate = '2025-12-31';

      const response = await request(app.getHttpServer())
        .get(`/shipping?from_date=${fromDate}&to_date=${toDate}`)
        .expect(200);

      expect(response.body).toHaveProperty('shipments');
    });
  });

  describe('GET /shipping/:id', () => {
    it('should return shipment details by ID', async () => {
      if (!createdShipmentId) {
        // Create a shipment first
        const createResponse = await request(app.getHttpServer())
          .post('/shipping')
          .send({
            userId: 'user-detail-test',
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
                productId: 'PROD-DETAIL',
                name: 'Detail Test',
                quantity: 1,
                weight: 5,
                dimensions: { length: 10, width: 10, height: 10 },
              },
            ],
          });
        createdShipmentId = createResponse.body.shipmentId;
      }

      const response = await request(app.getHttpServer())
        .get(`/shipping/${createdShipmentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        shipmentId: createdShipmentId,
        userId: expect.any(String),
        status: expect.any(String),
        trackingNumber: expect.any(String),
        origin: expect.any(Object),
        destination: expect.any(Object),
        products: expect.any(Array),
      });
    });

    it('should return 404 for non-existent shipment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/shipping/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-uuid';

      const response = await request(app.getHttpServer())
        .get(`/shipping/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should include tracking history', async () => {
      if (!createdShipmentId) return;

      const response = await request(app.getHttpServer())
        .get(`/shipping/${createdShipmentId}`)
        .expect(200);

      if (response.body.history) {
        expect(Array.isArray(response.body.history)).toBe(true);
      }
    });
  });

  describe('POST /shipping/:id/cancel', () => {
    it('should cancel a shipment', async () => {
      // Create a shipment to cancel
      const createResponse = await request(app.getHttpServer())
        .post('/shipping')
        .send({
          userId: 'user-cancel-test',
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
              productId: 'PROD-CANCEL',
              name: 'Cancel Test',
              quantity: 1,
              weight: 1,
              dimensions: { length: 10, width: 10, height: 10 },
            },
          ],
        });

      const shipmentId = createResponse.body.shipmentId;

      const response = await request(app.getHttpServer())
        .post(`/shipping/${shipmentId}/cancel`)
        .expect(200);

      expect(response.body).toMatchObject({
        shipmentId,
        status: 'CANCELLED',
        message: expect.any(String),
      });
    });

    it('should return 404 for cancelling non-existent shipment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post(`/shipping/${fakeId}/cancel`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should not allow cancelling already delivered shipment', async () => {
      // This test depends on business logic implementation
      // If implemented, should return 400 or 409
    });

    it('should not allow cancelling already cancelled shipment', async () => {
      // Create and cancel a shipment
      const createResponse = await request(app.getHttpServer())
        .post('/shipping')
        .send({
          userId: 'user-double-cancel',
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
              productId: 'PROD-DOUBLE',
              name: 'Double Cancel Test',
              quantity: 1,
              weight: 1,
              dimensions: { length: 10, width: 10, height: 10 },
            },
          ],
        });

      const shipmentId = createResponse.body.shipmentId;

      // First cancellation
      await request(app.getHttpServer())
        .post(`/shipping/${shipmentId}/cancel`)
        .expect(200);

      // Second cancellation should fail
      const response = await request(app.getHttpServer())
        .post(`/shipping/${shipmentId}/cancel`);

      expect([400, 409]).toContain(response.status);
    });
  });

  describe('Root Endpoint', () => {
    it('GET / should return service info', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('shipping-service');
    });
  });
});
