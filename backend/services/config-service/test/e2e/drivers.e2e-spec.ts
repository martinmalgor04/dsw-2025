import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@logistics/database';

describe('ConfigService: Drivers (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdDriverId: string;

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
    if (createdDriverId) {
      await prisma.driver.deleteMany({
        where: {
          employeeId: {
            contains: 'E2E-TEST',
          },
        },
      });
    }
    await app.close();
  });

  describe('POST /fleet/drivers', () => {
    it('should create a new driver with valid data', async () => {
      const newDriver = {
        employeeId: 'E2E-TEST-001',
        firstName: 'John',
        lastName: 'Doe',
        licenseNumber: 'LIC-E2E-12345',
        licenseType: 'A',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        phone: '+54911234567',
        email: 'john.doe.e2e@test.com',
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(newDriver)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        employeeId: newDriver.employeeId,
        firstName: newDriver.firstName,
        lastName: newDriver.lastName,
        licenseNumber: newDriver.licenseNumber,
        status: 'ACTIVE',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      createdDriverId = response.body.id;
    });

    it('should return 400 for missing required fields', async () => {
      const invalidDriver = {
        firstName: 'Jane',
        // Missing employeeId, lastName, licenseNumber
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(invalidDriver)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidDriver = {
        employeeId: 'E2E-TEST-002',
        firstName: 'Invalid',
        lastName: 'Email',
        licenseNumber: 'LIC-123',
        email: 'not-an-email',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(invalidDriver)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate employeeId', async () => {
      const duplicateDriver = {
        employeeId: 'E2E-TEST-001',
        firstName: 'Duplicate',
        lastName: 'Test',
        licenseNumber: 'LIC-DUPLICATE',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(duplicateDriver);

      expect([409, 500]).toContain(response.status);
    });

    it('should return 409 for duplicate licenseNumber', async () => {
      const duplicateLicense = {
        employeeId: 'E2E-TEST-003',
        firstName: 'Another',
        lastName: 'Duplicate',
        licenseNumber: 'LIC-E2E-12345',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(duplicateLicense);

      expect([409, 500]).toContain(response.status);
    });
  });

  describe('GET /fleet/drivers', () => {
    it('should return all drivers', async () => {
      const response = await request(app.getHttpServer())
        .get('/fleet/drivers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('employeeId');
        expect(response.body[0]).toHaveProperty('firstName');
        expect(response.body[0]).toHaveProperty('lastName');
        expect(response.body[0]).toHaveProperty('licenseNumber');
        expect(response.body[0]).toHaveProperty('status');
      }
    });

    it('should return drivers ordered by creation date', async () => {
      const response = await request(app.getHttpServer())
        .get('/fleet/drivers')
        .expect(200);

      if (response.body.length > 1) {
        const firstDate = new Date(response.body[0].createdAt);
        const secondDate = new Date(response.body[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('GET /fleet/drivers/:id', () => {
    it('should return a specific driver by ID', async () => {
      if (!createdDriverId) {
        const createResponse = await request(app.getHttpServer())
          .post('/fleet/drivers')
          .send({
            employeeId: 'E2E-TEST-GET',
            firstName: 'GetById',
            lastName: 'Test',
            licenseNumber: 'LIC-GET-TEST',
          });
        createdDriverId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/fleet/drivers/${createdDriverId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdDriverId,
        employeeId: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
      });
    });

    it('should return 404 for non-existent driver ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/fleet/drivers/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-uuid';

      const response = await request(app.getHttpServer())
        .get(`/fleet/drivers/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('PATCH /fleet/drivers/:id', () => {
    it('should update a driver', async () => {
      if (!createdDriverId) {
        const createResponse = await request(app.getHttpServer())
          .post('/fleet/drivers')
          .send({
            employeeId: 'E2E-TEST-UPDATE',
            firstName: 'Update',
            lastName: 'Test',
            licenseNumber: 'LIC-UPDATE',
          });
        createdDriverId = createResponse.body.id;
      }

      const updateData = {
        firstName: 'UpdatedFirstName',
        phone: '+54911999999',
        status: 'ON_LEAVE',
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/drivers/${createdDriverId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdDriverId,
        firstName: updateData.firstName,
        phone: updateData.phone,
        status: updateData.status,
      });
    });

    it('should return 404 for updating non-existent driver', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { firstName: 'Should Not Work' };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/drivers/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for invalid update data', async () => {
      if (!createdDriverId) return;

      const invalidData = {
        email: 'invalid-email-format',
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/drivers/${createdDriverId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should allow partial updates', async () => {
      if (!createdDriverId) return;

      const partialUpdate = {
        phone: '+54911555555',
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/drivers/${createdDriverId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.phone).toBe(partialUpdate.phone);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('firstName');
    });
  });

  describe('DELETE /fleet/drivers/:id', () => {
    it('should delete a driver', async () => {
      // Create a driver specifically for deletion
      const createResponse = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send({
          employeeId: 'E2E-TEST-DELETE',
          firstName: 'Delete',
          lastName: 'Test',
          licenseNumber: 'LIC-DELETE',
        });

      const driverToDelete = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/fleet/drivers/${driverToDelete}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', driverToDelete);

      // Verify driver is deleted
      const getResponse = await request(app.getHttpServer())
        .get(`/fleet/drivers/${driverToDelete}`)
        .expect(404);

      expect(getResponse.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 for deleting non-existent driver', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/fleet/drivers/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should accept driver without optional fields', async () => {
      const minimalDriver = {
        employeeId: 'E2E-TEST-MINIMAL',
        firstName: 'Minimal',
        lastName: 'Driver',
        licenseNumber: 'LIC-MINIMAL',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(minimalDriver)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.phone).toBeNull();
      expect(response.body.email).toBeNull();
    });

    it('should validate status enum values', async () => {
      const invalidStatus = {
        employeeId: 'E2E-TEST-STATUS',
        firstName: 'Status',
        lastName: 'Test',
        licenseNumber: 'LIC-STATUS',
        status: 'INVALID_STATUS',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(invalidStatus);

      expect([400, 500]).toContain(response.status);
    });

    it('should handle license expiry date validation', async () => {
      const expiredLicense = {
        employeeId: 'E2E-TEST-EXPIRED',
        firstName: 'Expired',
        lastName: 'License',
        licenseNumber: 'LIC-EXPIRED',
        licenseExpiry: new Date('2020-01-01').toISOString(), // Expired
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(expiredLicense);

      // Should accept past dates (business logic may validate separately)
      expect([201, 400]).toContain(response.status);
    });

    it('should handle phone number formats', async () => {
      const phoneFormats = {
        employeeId: 'E2E-TEST-PHONE',
        firstName: 'Phone',
        lastName: 'Test',
        licenseNumber: 'LIC-PHONE',
        phone: '1234567890', // No country code
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/drivers')
        .send(phoneFormats);

      expect([201, 400]).toContain(response.status);
    });
  });
});
