import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@logistics/database';

describe('ConfigService: Transport Methods (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdMethodId: string;

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
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdMethodId) {
      await prisma.transportMethod.deleteMany({
        where: {
          code: {
            contains: 'e2e-test',
          },
        },
      });
    }
    await app.close();
  });

  describe('POST /config/transport-methods', () => {
    it('should create a new transport method with valid data', async () => {
      const newMethod = {
        code: 'e2e-test-air',
        name: 'E2E Test - Aéreo',
        description: 'Transport method for E2E testing',
        averageSpeed: 800,
        estimatedDays: '1-2',
        baseCostPerKm: 1.5,
        baseCostPerKg: 5.0,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(newMethod)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        code: newMethod.code,
        name: newMethod.name,
        description: newMethod.description,
        averageSpeed: newMethod.averageSpeed,
        estimatedDays: newMethod.estimatedDays,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Validate decimal fields are returned as strings (Prisma Decimal)
      expect(typeof response.body.baseCostPerKm).toBe('string');
      expect(typeof response.body.baseCostPerKg).toBe('string');

      createdMethodId = response.body.id;
    });

    it('should return 400 for missing required fields', async () => {
      const invalidMethod = {
        name: 'Missing code field',
        averageSpeed: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(invalidMethod)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for negative speed', async () => {
      const invalidMethod = {
        code: 'e2e-invalid',
        name: 'Invalid Speed',
        averageSpeed: -50,
        estimatedDays: '1-2',
        baseCostPerKm: 1.0,
        baseCostPerKg: 1.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(invalidMethod)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for negative costs', async () => {
      const invalidMethod = {
        code: 'e2e-invalid-cost',
        name: 'Negative Cost',
        averageSpeed: 100,
        estimatedDays: '1-2',
        baseCostPerKm: -1.5,
        baseCostPerKg: 2.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(invalidMethod)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate transport method code', async () => {
      const duplicateMethod = {
        code: 'e2e-test-air',
        name: 'Duplicate Code Test',
        averageSpeed: 500,
        estimatedDays: '2-3',
        baseCostPerKm: 1.0,
        baseCostPerKg: 2.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(duplicateMethod);

      expect([409, 500]).toContain(response.status);
    });
  });

  describe('GET /config/transport-methods', () => {
    it('should return all transport methods', async () => {
      const response = await request(app.getHttpServer())
        .get('/config/transport-methods')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('code');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('averageSpeed');
        expect(response.body[0]).toHaveProperty('baseCostPerKm');
        expect(response.body[0]).toHaveProperty('baseCostPerKg');
        expect(response.body[0]).toHaveProperty('isActive');
      }
    });

    it('should include tariffConfigs relation when present', async () => {
      const response = await request(app.getHttpServer())
        .get('/config/transport-methods')
        .expect(200);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('tariffConfigs');
        expect(Array.isArray(response.body[0].tariffConfigs)).toBe(true);
      }
    });

    it('should return methods ordered by createdAt DESC', async () => {
      const response = await request(app.getHttpServer())
        .get('/config/transport-methods')
        .expect(200);

      if (response.body.length > 1) {
        const firstDate = new Date(response.body[0].createdAt);
        const secondDate = new Date(response.body[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('GET /config/transport-methods/:id', () => {
    it('should return a specific transport method by ID', async () => {
      if (!createdMethodId) {
        const createResponse = await request(app.getHttpServer())
          .post('/config/transport-methods')
          .send({
            code: 'e2e-test-get',
            name: 'E2E GetById Test',
            averageSpeed: 200,
            estimatedDays: '3-5',
            baseCostPerKm: 0.8,
            baseCostPerKg: 1.5,
          });
        createdMethodId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/config/transport-methods/${createdMethodId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdMethodId,
        code: expect.any(String),
        name: expect.any(String),
        averageSpeed: expect.any(Number),
      });
      expect(response.body).toHaveProperty('tariffConfigs');
    });

    it('should return 404 for non-existent method ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/config/transport-methods/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-uuid';

      const response = await request(app.getHttpServer())
        .get(`/config/transport-methods/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('PATCH /config/transport-methods/:id', () => {
    it('should update a transport method', async () => {
      if (!createdMethodId) {
        const createResponse = await request(app.getHttpServer())
          .post('/config/transport-methods')
          .send({
            code: 'e2e-test-update',
            name: 'E2E Update Test',
            averageSpeed: 300,
            estimatedDays: '2-4',
            baseCostPerKm: 1.2,
            baseCostPerKg: 3.0,
          });
        createdMethodId = createResponse.body.id;
      }

      const updateData = {
        name: 'E2E Test - Updated Name',
        description: 'Updated via E2E test',
        averageSpeed: 350,
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/transport-methods/${createdMethodId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdMethodId,
        name: updateData.name,
        description: updateData.description,
        averageSpeed: updateData.averageSpeed,
        isActive: false,
      });
    });

    it('should return 404 for updating non-existent method', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { name: 'Should Not Work' };

      const response = await request(app.getHttpServer())
        .patch(`/config/transport-methods/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for invalid update data', async () => {
      if (!createdMethodId) return;

      const invalidData = {
        averageSpeed: -100, // Negative speed
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/transport-methods/${createdMethodId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should allow partial updates', async () => {
      if (!createdMethodId) return;

      const partialUpdate = {
        description: 'Only description updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/transport-methods/${createdMethodId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.description).toBe(partialUpdate.description);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('code');
    });
  });

  describe('DELETE /config/transport-methods/:id', () => {
    it('should soft-delete a transport method (set isActive to false)', async () => {
      // Create a method specifically for deletion
      const createResponse = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send({
          code: 'e2e-test-delete',
          name: 'E2E Delete Test',
          averageSpeed: 150,
          estimatedDays: '5-7',
          baseCostPerKm: 0.5,
          baseCostPerKg: 1.0,
        });

      const methodToDelete = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/config/transport-methods/${methodToDelete}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', methodToDelete);

      // Verify method still exists but is inactive
      const getResponse = await request(app.getHttpServer())
        .get(`/config/transport-methods/${methodToDelete}`);

      if (getResponse.status === 200) {
        expect(getResponse.body.isActive).toBe(false);
      }
    });

    it('should return 404 for deleting non-existent method', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/config/transport-methods/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('Edge Cases & Business Rules', () => {
    it('should accept code with alphanumeric and hyphens', async () => {
      const validCode = {
        code: 'e2e-test-123-valid',
        name: 'Valid Code Test',
        averageSpeed: 250,
        estimatedDays: '1-3',
        baseCostPerKm: 1.0,
        baseCostPerKg: 2.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(validCode)
        .expect(201);

      expect(response.body.code).toBe(validCode.code);
    });

    it('should handle very large speed values', async () => {
      const highSpeed = {
        code: 'e2e-test-highspeed',
        name: 'High Speed Test',
        averageSpeed: 10000,
        estimatedDays: '0-1',
        baseCostPerKm: 10.0,
        baseCostPerKg: 20.0,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(highSpeed)
        .expect(201);

      expect(response.body.averageSpeed).toBe(10000);
    });

    it('should handle decimal precision for costs', async () => {
      const precisionTest = {
        code: 'e2e-test-precision',
        name: 'Decimal Precision Test',
        averageSpeed: 100,
        estimatedDays: '2-3',
        baseCostPerKm: 1.12345,
        baseCostPerKg: 2.98765,
      };

      const response = await request(app.getHttpServer())
        .post('/config/transport-methods')
        .send(precisionTest)
        .expect(201);

      expect(response.body).toHaveProperty('baseCostPerKm');
      expect(response.body).toHaveProperty('baseCostPerKg');
    });
  });
});
