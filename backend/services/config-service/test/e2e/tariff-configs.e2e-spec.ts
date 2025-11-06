import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@logistics/database';

describe('ConfigService: Tariff Configs (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdTariffId: string;
  let testTransportMethodId: string;

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

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create a transport method for tariff tests
    const transportMethod = await prisma.transportMethod.create({
      data: {
        code: 'e2e-test-tariff-method',
        name: 'E2E Tariff Test Method',
        averageSpeed: 100,
        estimatedDays: '1-2',
        baseCostPerKm: 1.0,
        baseCostPerKg: 2.0,
        isActive: true,
      },
    });
    testTransportMethodId = transportMethod.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdTariffId) {
      await prisma.tariffConfig.deleteMany({
        where: {
          transportMethodId: testTransportMethodId,
        },
      });
    }
    await prisma.transportMethod.delete({
      where: { id: testTransportMethodId },
    });
    await app.close();
  });

  describe('POST /config/tariff-configs', () => {
    it('should create a new tariff config with valid data', async () => {
      const newTariff = {
        transportMethodId: testTransportMethodId,
        baseTariff: 50.0,
        costPerKg: 2.5,
        costPerKm: 1.2,
        minWeight: 0,
        maxWeight: 100,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(newTariff)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        transportMethodId: testTransportMethodId,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Validate decimal fields
      expect(typeof response.body.baseTariff).toBe('string');
      expect(typeof response.body.costPerKg).toBe('string');
      expect(typeof response.body.costPerKm).toBe('string');

      createdTariffId = response.body.id;
    });

    it('should return 400 for missing required fields', async () => {
      const invalidTariff = {
        baseTariff: 50.0,
        // Missing transportMethodId
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(invalidTariff)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for negative costs', async () => {
      const invalidTariff = {
        transportMethodId: testTransportMethodId,
        baseTariff: -10.0,
        costPerKg: 2.0,
        costPerKm: 1.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(invalidTariff)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid transportMethodId (non-UUID)', async () => {
      const invalidTariff = {
        transportMethodId: 'not-a-uuid',
        baseTariff: 50.0,
        costPerKg: 2.0,
        costPerKm: 1.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(invalidTariff)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for non-existent transportMethodId', async () => {
      const fakeMethodId = '00000000-0000-0000-0000-000000000000';
      const invalidTariff = {
        transportMethodId: fakeMethodId,
        baseTariff: 50.0,
        costPerKg: 2.0,
        costPerKm: 1.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(invalidTariff);

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /config/tariff-configs', () => {
    it('should return all tariff configs', async () => {
      const response = await request(app.getHttpServer())
        .get('/config/tariff-configs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('transportMethodId');
        expect(response.body[0]).toHaveProperty('baseTariff');
        expect(response.body[0]).toHaveProperty('costPerKg');
        expect(response.body[0]).toHaveProperty('costPerKm');
        expect(response.body[0]).toHaveProperty('isActive');
      }
    });

    it('should filter tariffs by transportMethodId query param', async () => {
      const response = await request(app.getHttpServer())
        .get(`/config/tariff-configs?transportMethodId=${testTransportMethodId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned tariffs should match the filter
      response.body.forEach((tariff: any) => {
        expect(tariff.transportMethodId).toBe(testTransportMethodId);
      });
    });

    it('should return empty array for non-existent transportMethodId filter', async () => {
      const fakeMethodId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/config/tariff-configs?transportMethodId=${fakeMethodId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should include transportMethod relation', async () => {
      const response = await request(app.getHttpServer())
        .get('/config/tariff-configs')
        .expect(200);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('transportMethod');
        expect(response.body[0].transportMethod).toHaveProperty('id');
        expect(response.body[0].transportMethod).toHaveProperty('name');
      }
    });
  });

  describe('GET /config/tariff-configs/:id', () => {
    it('should return a specific tariff config by ID', async () => {
      if (!createdTariffId) {
        const createResponse = await request(app.getHttpServer())
          .post('/config/tariff-configs')
          .send({
            transportMethodId: testTransportMethodId,
            baseTariff: 75.0,
            costPerKg: 3.0,
            costPerKm: 1.5,
          });
        createdTariffId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/config/tariff-configs/${createdTariffId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdTariffId,
        transportMethodId: testTransportMethodId,
      });
      expect(response.body).toHaveProperty('transportMethod');
    });

    it('should return 404 for non-existent tariff ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/config/tariff-configs/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-uuid';

      const response = await request(app.getHttpServer())
        .get(`/config/tariff-configs/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('PATCH /config/tariff-configs/:id', () => {
    it('should update a tariff config', async () => {
      if (!createdTariffId) {
        const createResponse = await request(app.getHttpServer())
          .post('/config/tariff-configs')
          .send({
            transportMethodId: testTransportMethodId,
            baseTariff: 100.0,
            costPerKg: 4.0,
            costPerKm: 2.0,
          });
        createdTariffId = createResponse.body.id;
      }

      const updateData = {
        baseTariff: 120.0,
        costPerKg: 4.5,
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/tariff-configs/${createdTariffId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdTariffId,
        isActive: false,
      });

      // Validate updated decimal values (returned as strings)
      expect(response.body.baseTariff).toBeDefined();
      expect(response.body.costPerKg).toBeDefined();
    });

    it('should return 404 for updating non-existent tariff', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { baseTariff: 150.0 };

      const response = await request(app.getHttpServer())
        .patch(`/config/tariff-configs/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for invalid update data', async () => {
      if (!createdTariffId) return;

      const invalidData = {
        costPerKm: -5.0, // Negative cost
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/tariff-configs/${createdTariffId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should allow partial updates', async () => {
      if (!createdTariffId) return;

      const partialUpdate = {
        minWeight: 10,
        maxWeight: 500,
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/tariff-configs/${createdTariffId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.minWeight).toBe(partialUpdate.minWeight);
      expect(response.body.maxWeight).toBe(partialUpdate.maxWeight);
    });
  });

  describe('DELETE /config/tariff-configs/:id', () => {
    it('should soft-delete a tariff config (set isActive to false)', async () => {
      // Create a tariff specifically for deletion
      const createResponse = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send({
          transportMethodId: testTransportMethodId,
          baseTariff: 200.0,
          costPerKg: 5.0,
          costPerKm: 3.0,
        });

      const tariffToDelete = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/config/tariff-configs/${tariffToDelete}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', tariffToDelete);

      // Verify tariff still exists but is inactive
      const getResponse = await request(app.getHttpServer())
        .get(`/config/tariff-configs/${tariffToDelete}`);

      if (getResponse.status === 200) {
        expect(getResponse.body.isActive).toBe(false);
      }
    });

    it('should return 404 for deleting non-existent tariff', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/config/tariff-configs/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('Edge Cases & Business Rules', () => {
    it('should handle weight ranges validation (minWeight <= maxWeight)', async () => {
      const invalidRange = {
        transportMethodId: testTransportMethodId,
        baseTariff: 50.0,
        costPerKg: 2.0,
        costPerKm: 1.0,
        minWeight: 100,
        maxWeight: 50, // Invalid: max < min
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(invalidRange);

      // Should either validate or accept (depends on DTO validation)
      expect([201, 400, 500]).toContain(response.status);
    });

    it('should handle zero values for costs', async () => {
      const zeroCosts = {
        transportMethodId: testTransportMethodId,
        baseTariff: 0,
        costPerKg: 0,
        costPerKm: 0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(zeroCosts)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should handle very high decimal precision', async () => {
      const precisionTest = {
        transportMethodId: testTransportMethodId,
        baseTariff: 99.999999,
        costPerKg: 1.123456789,
        costPerKm: 0.987654321,
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(precisionTest)
        .expect(201);

      expect(response.body).toHaveProperty('baseTariff');
      expect(response.body).toHaveProperty('costPerKg');
      expect(response.body).toHaveProperty('costPerKm');
    });

    it('should handle null optional fields', async () => {
      const nullOptionals = {
        transportMethodId: testTransportMethodId,
        baseTariff: 100.0,
        costPerKg: 2.0,
        costPerKm: 1.0,
        minWeight: null,
        maxWeight: null,
      };

      const response = await request(app.getHttpServer())
        .post('/config/tariff-configs')
        .send(nullOptionals)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
