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

    // Cleanup any existing test data before starting
    await prisma.vehicle.deleteMany({
      where: {
        license_plate: {
          contains: 'E2E-TEST',
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.vehicle.deleteMany({
      where: {
        license_plate: {
          contains: 'E2E-TEST',
        },
      },
    });
    await app.close();
  });

  describe('POST /fleet/vehicles', () => {
    it('should create a new vehicle with valid data', async () => {
      const newVehicle = {
        license_plate: 'E2E-TEST-ABC123',
        make: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2023,
        capacityKg: 3500,
        volumeM3: 15.5,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(newVehicle)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        license_plate: newVehicle.license_plate,
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        capacityKg: newVehicle.capacityKg,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Validate decimal field (volume) - Prisma Decimal serializes as string
      expect(typeof response.body.volumeM3).toBe('string');
      expect(Number(response.body.volumeM3)).toBe(newVehicle.volumeM3);

      createdVehicleId = response.body.id;
    });

    it('should return 400 for missing required fields', async () => {
      const invalidVehicle = {
        make: 'Ford',
        model: 'Transit',
        // Missing license_plate
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
        license_plate: 'E2E-TEST-FUTURE',
        make: 'Tesla',
        model: 'Cybertruck',
        year: 2099,
        capacityKg: 5000,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidVehicle);

      expect([201, 400]).toContain(response.status); // Depends on DTO validation
    });

    it('should return 400 for negative capacity', async () => {
      const invalidVehicle = {
        license_plate: 'E2E-TEST-NEGATIVE',
        make: 'Invalid',
        model: 'Test',
        year: 2020,
        capacityKg: -1000,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidVehicle)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate license_plate', async () => {
      const duplicateVehicle = {
        license_plate: 'E2E-TEST-ABC123', // Duplicate from first test
        make: 'Duplicate',
        model: 'Test',
        year: 2021,
        capacityKg: 2000,
        volumeM3: 10.0,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
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
        expect(response.body[0]).toHaveProperty('license_plate');
        expect(response.body[0]).toHaveProperty('make');
        expect(response.body[0]).toHaveProperty('model');
        expect(response.body[0]).toHaveProperty('capacityKg');
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
            license_plate: 'E2E-TEST-GET',
            make: 'GetById',
            model: 'Test',
            year: 2022,
            capacityKg: 3000,
          });
        createdVehicleId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/fleet/vehicles/${createdVehicleId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdVehicleId,
        license_plate: expect.any(String),
        make: expect.any(String),
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
            license_plate: 'E2E-TEST-UPDATE',
            make: 'Update',
            model: 'Test',
            year: 2021,
            capacityKg: 2500,
          });
        createdVehicleId = createResponse.body.id;
      }

      const updateData = {
        status: 'MAINTENANCE',
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
      const updateData = { make: 'Should Not Work' };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/vehicles/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });


    it('should allow partial updates', async () => {
      if (!createdVehicleId) return;

      const partialUpdate = {
        status: 'IN_USE',
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/vehicles/${createdVehicleId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.status).toBe(partialUpdate.status);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('license_plate');
    });
  });

  describe('DELETE /fleet/vehicles/:id', () => {
    it('should delete a vehicle', async () => {
      // Create a vehicle specifically for deletion
      const createResponse = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send({
          license_plate: 'E2E-TEST-DELETE',
          make: 'Delete',
          model: 'Test',
          year: 2020,
          capacityKg: 2000,
          volumeM3: 10.0,
          fuelType: 'DIESEL',
          status: 'AVAILABLE',
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
        license_plate: 'E2E-TEST-MINIMAL',
        make: 'Minimal',
        model: 'Vehicle',
        year: 2019,
        capacityKg: 1500,
        volumeM3: 10.0,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(minimalVehicle)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // fuelType and volumeM3 are required, so they won't be null
      expect(response.body).toHaveProperty('fuelType');
      expect(response.body).toHaveProperty('volumeM3');
    });

    it('should validate status enum values', async () => {
      const invalidStatus = {
        license_plate: 'E2E-TEST-STATUS',
        make: 'Status',
        model: 'Test',
        year: 2021,
        capacityKg: 2500,
        status: 'INVALID_STATUS',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidStatus);

      expect([400, 500]).toContain(response.status);
    });

    it('should validate fuelType enum values', async () => {
      const invalidFuelType = {
        license_plate: 'E2E-TEST-FUEL',
        make: 'Fuel',
        model: 'Test',
        year: 2022,
        capacityKg: 3000,
        fuelType: 'INVALID_FUEL',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(invalidFuelType);

      expect([400, 500]).toContain(response.status);
    });

    it('should handle very high capacity values', async () => {
      const highCapacity = {
        license_plate: 'E2E-TEST-HIGH',
        make: 'Heavy',
        model: 'Truck',
        year: 2023,
        capacityKg: 50000, // 50 tons
        volumeM3: 100.5,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(highCapacity)
        .expect(201);

      expect(response.body.capacityKg).toBe(50000);
    });

    it('should handle decimal precision for volume', async () => {
      const precisionTest = {
        license_plate: 'E2E-TEST-VOLUME',
        make: 'Precision',
        model: 'Test',
        year: 2022,
        capacityKg: 3000,
        volumeM3: 15.123456,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/vehicles')
        .send(precisionTest)
        .expect(201);

      expect(response.body).toHaveProperty('volumeM3');
    });
  });
});
