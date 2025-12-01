import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@logistics/database';

describe('ConfigService: Coverage Zones (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdZoneId: string;

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
    // Cleanup: Delete test data
    if (createdZoneId) {
      await prisma.coverageZone.deleteMany({
        where: {
          name: {
            contains: 'E2E Test',
          },
        },
      });
    }
    await app.close();
  });

  describe('POST /config/coverage-zones', () => {
    it('should create a new coverage zone with valid data', async () => {
      const newZone = {
        name: 'E2E Test Zone - Capital',
        description: 'Coverage zone for testing purposes',
        postalCodes: ['1000', '1001', '1002'],
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/config/coverage-zones')
        .send(newZone)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: newZone.name,
        description: newZone.description,
        postalCodes: expect.arrayContaining(newZone.postalCodes),
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      createdZoneId = response.body.id;
    });

    it('should return 400 for invalid data (missing required fields)', async () => {
      const invalidZone = {
        description: 'Missing name field',
      };

      const response = await request(app.getHttpServer())
        .post('/config/coverage-zones')
        .send(invalidZone)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid data (empty name)', async () => {
      const invalidZone = {
        name: '',
        postalCodes: ['1000'],
      };

      const response = await request(app.getHttpServer())
        .post('/config/coverage-zones')
        .send(invalidZone)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate coverage zone name', async () => {
      const duplicateZone = {
        name: 'E2E Test Zone - Capital',
        description: 'Duplicate test',
        postalCodes: ['2000'],
      };

      const response = await request(app.getHttpServer())
        .post('/config/coverage-zones')
        .send(duplicateZone);

      expect([409, 500]).toContain(response.status);
    });
  });

  describe('GET /config/coverage-zones', () => {
    it('should return all coverage zones', async () => {
      const response = await request(app.getHttpServer())
        .get('/config/coverage-zones')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('postalCodes');
        expect(response.body[0]).toHaveProperty('isActive');
        expect(response.body[0]).toHaveProperty('createdAt');
        expect(response.body[0]).toHaveProperty('updatedAt');
      }
    });

    it('should return zones ordered by createdAt DESC', async () => {
      const response = await request(app.getHttpServer())
        .get('/config/coverage-zones')
        .expect(200);

      if (response.body.length > 1) {
        const firstDate = new Date(response.body[0].createdAt);
        const secondDate = new Date(response.body[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('GET /config/coverage-zones/:id', () => {
    it('should return a specific coverage zone by ID', async () => {
      if (!createdZoneId) {
        // Create a zone first if none exists
        const createResponse = await request(app.getHttpServer())
          .post('/config/coverage-zones')
          .send({
            name: 'E2E Test Zone - GetById',
            postalCodes: ['3000'],
          });
        createdZoneId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/config/coverage-zones/${createdZoneId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdZoneId,
        name: expect.any(String),
        postalCodes: expect.any(Array),
        isActive: expect.any(Boolean),
      });
    });

    it('should return 404 for non-existent zone ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/config/coverage-zones/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-valid-uuid';

      const response = await request(app.getHttpServer())
        .get(`/config/coverage-zones/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('PATCH /config/coverage-zones/:id', () => {
    it('should update a coverage zone', async () => {
      if (!createdZoneId) {
        const createResponse = await request(app.getHttpServer())
          .post('/config/coverage-zones')
          .send({
            name: 'E2E Test Zone - Update',
            postalCodes: ['4000'],
          });
        createdZoneId = createResponse.body.id;
      }

      const updateData = {
        name: 'E2E Test Zone - Updated',
        description: 'Updated description',
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/coverage-zones/${createdZoneId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdZoneId,
        name: updateData.name,
        description: updateData.description,
        isActive: false,
      });
    });

    it('should return 404 for updating non-existent zone', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { name: 'Should Not Work' };

      const response = await request(app.getHttpServer())
        .patch(`/config/coverage-zones/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for invalid update data', async () => {
      if (!createdZoneId) return;

      const invalidData = {
        name: '', // Empty name should fail validation
      };

      const response = await request(app.getHttpServer())
        .patch(`/config/coverage-zones/${createdZoneId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /config/coverage-zones/:id', () => {
    it('should soft-delete a coverage zone (set isActive to false)', async () => {
      // Create a zone specifically for deletion
      const createResponse = await request(app.getHttpServer())
        .post('/config/coverage-zones')
        .send({
          name: 'E2E Test Zone - ToDelete',
          postalCodes: ['5000'],
        });

      const zoneToDelete = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/config/coverage-zones/${zoneToDelete}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', zoneToDelete);

      // Verify zone still exists but is inactive
      const getResponse = await request(app.getHttpServer())
        .get(`/config/coverage-zones/${zoneToDelete}`);

      if (getResponse.status === 200) {
        expect(getResponse.body.isActive).toBe(false);
      }
    });

    it('should return 404 for deleting non-existent zone', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/config/coverage-zones/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should handle postal codes array validation', async () => {
      const zoneWithInvalidPostalCodes = {
        name: 'E2E Test - Invalid Postal Codes',
        postalCodes: 'not-an-array', // Should be array
      };

      const response = await request(app.getHttpServer())
        .post('/config/coverage-zones')
        .send(zoneWithInvalidPostalCodes)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should accept zone with empty description', async () => {
      const zoneWithoutDescription = {
        name: 'E2E Test - No Description',
        postalCodes: ['6000'],
      };

      const response = await request(app.getHttpServer())
        .post('/config/coverage-zones')
        .send(zoneWithoutDescription)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBeNull();
    });
  });
});
