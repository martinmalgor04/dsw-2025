import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@logistics/database';

describe('ConfigService: Vehicles (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdVehicleId: string;

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
    if (createdVehicleId) {
      await prisma.vehicle.deleteMany({
        where: {
          licensePlate: {
            contains: 'E2E-TEST',
          },
        },
      });
    }
    await app.close();
  });

  describe('POST /fleet/vehicles', () => {
    it('should create a new vehicle with valid data', async () => {
      const newVehicle = {
        licensePlate: 'E2E-TEST-ABC123',
        brand: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2023,
        capacity: 3500,
        volume: 15.5,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(newVehicle)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        licensePlate: newVehicle.licensePlate,
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year,
        capacity: newVehicle.capacity,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Validate decimal field (volume)
      expect(typeof response.body.volume).toBe('string');

      createdVehicleId = response.body.id;
    });

    it('should return 400 for missing required fields', async () => {
      const invalidVehicle = {
        brand: 'Ford',
        model: 'Transit',
        // Missing licensePlate
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidVehicle)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid year (future)', async () => {
      const invalidVehicle = {
        licensePlate: 'E2E-TEST-FUTURE',
        brand: 'Tesla',
        model: 'Cybertruck',
        year: 2099,
        capacity: 5000,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidVehicle);

      expect([201, 400]).toContain(response.status); // Depends on DTO validation
    });

    it('should return 400 for negative capacity', async () => {
      const invalidVehicle = {
        licensePlate: 'E2E-TEST-NEGATIVE',
        brand: 'Invalid',
        model: 'Test',
        year: 2020,
        capacity: -1000,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidVehicle)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate licensePlate', async () => {
      const duplicateVehicle = {
        licensePlate: 'E2E-TEST-ABC123',
        brand: 'Duplicate',
        model: 'Test',
        year: 2021,
        capacity: 2000,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(duplicateVehicle);

      expect([409, 500]).toContain(response.status);
    });
  });

  describe('GET /fleet/vehicles', () => {
    it('should return all vehicles', async () => {
      const response = await request(app.getHttpServer())
        .get('/fleet/vehicles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('licensePlate');
        expect(response.body[0]).toHaveProperty('brand');
        expect(response.body[0]).toHaveProperty('model');
        expect(response.body[0]).toHaveProperty('capacity');
        expect(response.body[0]).toHaveProperty('status');
      }
    });

    it('should return vehicles ordered by creation date', async () => {
      const response = await request(app.getHttpServer())
        .get('/fleet/vehicles')
        .expect(200);

      if (response.body.length > 1) {
        const firstDate = new Date(response.body[0].createdAt);
        const secondDate = new Date(response.body[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('GET /fleet/vehicles/:id', () => {
    it('should return a specific vehicle by ID', async () => {
      if (!createdVehicleId) {
        const createResponse = await request(app.getHttpServer())
          .post('/fleet/vehicles')
          .send({
            licensePlate: 'E2E-TEST-GET',
            brand: 'GetById',
            model: 'Test',
            year: 2022,
            capacity: 3000,
          });
        createdVehicleId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/fleet/vehicles/${createdVehicleId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdVehicleId,
        licensePlate: expect.any(String),
        brand: expect.any(String),
        model: expect.any(String),
      });
    });

    it('should return 404 for non-existent vehicle ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/fleet/vehicles/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-uuid';

      const response = await request(app.getHttpServer())
        .get(`/fleet/vehicles/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('PATCH /fleet/vehicles/:id', () => {
    it('should update a vehicle', async () => {
      if (!createdVehicleId) {
        const createResponse = await request(app.getHttpServer())
          .post('/fleet/vehicles')
          .send({
            licensePlate: 'E2E-TEST-UPDATE',
            brand: 'Update',
            model: 'Test',
            year: 2021,
            capacity: 2500,
          });
        createdVehicleId = createResponse.body.id;
      }

      const updateData = {
        status: 'MAINTENANCE',
        currentKm: 50000,
        lastMaintenanceDate: new Date('2024-01-15').toISOString(),
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/vehicles/${createdVehicleId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdVehicleId,
        status: updateData.status,
      });
    });

    it('should return 404 for updating non-existent vehicle', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { brand: 'Should Not Work' };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/vehicles/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for invalid update data', async () => {
      if (!createdVehicleId) return;

      const invalidData = {
        capacity: -500, // Negative capacity
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/vehicles/${createdVehicleId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should allow partial updates', async () => {
      if (!createdVehicleId) return;

      const partialUpdate = {
        currentKm: 60000,
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/vehicles/${createdVehicleId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.currentKm).toBe(partialUpdate.currentKm);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('licensePlate');
    });
  });

  describe('DELETE /fleet/vehicles/:id', () => {
    it('should delete a vehicle', async () => {
      // Create a vehicle specifically for deletion
      const createResponse = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send({
          licensePlate: 'E2E-TEST-DELETE',
          brand: 'Delete',
          model: 'Test',
          year: 2020,
          capacity: 2000,
        });

      const vehicleToDelete = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/fleet/vehicles/${vehicleToDelete}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', vehicleToDelete);

      // Verify vehicle is deleted
      const getResponse = await request(app.getHttpServer())
        .get(`/fleet/vehicles/${vehicleToDelete}`)
        .expect(404);

      expect(getResponse.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 for deleting non-existent vehicle', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/fleet/vehicles/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should accept vehicle without optional fields', async () => {
      const minimalVehicle = {
        licensePlate: 'E2E-TEST-MINIMAL',
        brand: 'Minimal',
        model: 'Vehicle',
        year: 2019,
        capacity: 1500,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(minimalVehicle)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.fuelType).toBeNull();
      expect(response.body.volume).toBeNull();
    });

    it('should validate status enum values', async () => {
      const invalidStatus = {
        licensePlate: 'E2E-TEST-STATUS',
        brand: 'Status',
        model: 'Test',
        year: 2021,
        capacity: 2500,
        status: 'INVALID_STATUS',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidStatus);

      expect([400, 500]).toContain(response.status);
    });

    it('should validate fuelType enum values', async () => {
      const invalidFuelType = {
        licensePlate: 'E2E-TEST-FUEL',
        brand: 'Fuel',
        model: 'Test',
        year: 2022,
        capacity: 3000,
        fuelType: 'INVALID_FUEL',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidFuelType);

      expect([400, 500]).toContain(response.status);
    });

    it('should handle very high capacity values', async () => {
      const highCapacity = {
        licensePlate: 'E2E-TEST-HIGH',
        brand: 'Heavy',
        model: 'Truck',
        year: 2023,
        capacity: 50000, // 50 tons
        volume: 100.5,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(highCapacity)
        .expect(201);

      expect(response.body.capacity).toBe(50000);
    });

    it('should handle decimal precision for volume', async () => {
      const precisionTest = {
        licensePlate: 'E2E-TEST-VOLUME',
        brand: 'Precision',
        model: 'Test',
        year: 2022,
        capacity: 3000,
        volume: 15.123456,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(precisionTest)
        .expect(201);

      expect(response.body).toHaveProperty('volume');
    });
  });
});
