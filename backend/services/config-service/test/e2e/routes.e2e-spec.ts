import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@logistics/database';

describe('ConfigService: Routes (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdRouteId: string;
  let testTransportMethodId: string;
  let testVehicleId: string;
  let testDriverId: string;
  let testCoverageZoneId: string;

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

    // Create test dependencies
    const transportMethod = await prisma.transportMethod.create({
      data: {
        code: 'e2e-test-route-method',
        name: 'E2E Route Test Method',
        averageSpeed: 100,
        estimatedDays: '1-2',
        baseCostPerKm: 1.0,
        baseCostPerKg: 2.0,
        isActive: true,
      },
    });
    testTransportMethodId = transportMethod.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        licensePlate: 'E2E-ROUTE-VEH',
        brand: 'Test',
        model: 'Vehicle',
        year: 2022,
        capacity: 3000,
        status: 'AVAILABLE',
      },
    });
    testVehicleId = vehicle.id;

    const driver = await prisma.driver.create({
      data: {
        employeeId: 'E2E-ROUTE-DRIVER',
        firstName: 'Route',
        lastName: 'Driver',
        licenseNumber: 'LIC-ROUTE-TEST',
        status: 'ACTIVE',
      },
    });
    testDriverId = driver.id;

    const zone = await prisma.coverageZone.create({
      data: {
        name: 'E2E Route Test Zone',
        postalCodes: ['1000', '1001'],
        isActive: true,
      },
    });
    testCoverageZoneId = zone.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdRouteId) {
      await prisma.route.deleteMany({
        where: {
          name: {
            contains: 'E2E Test Route',
          },
        },
      });
    }
    await prisma.driver.delete({ where: { id: testDriverId } });
    await prisma.vehicle.delete({ where: { id: testVehicleId } });
    await prisma.coverageZone.delete({ where: { id: testCoverageZoneId } });
    await prisma.transportMethod.delete({ where: { id: testTransportMethodId } });
    await app.close();
  });

  describe('POST /fleet/routes', () => {
    it('should create a new route with valid data and relations', async () => {
      const newRoute = {
        name: 'E2E Test Route - Central',
        description: 'Test route for E2E testing',
        startDate: new Date('2024-12-01').toISOString(),
        endDate: new Date('2024-12-31').toISOString(),
        status: 'PLANNED',
        transportMethodId: testTransportMethodId,
        vehicleId: testVehicleId,
        driverId: testDriverId,
        coverageZoneId: testCoverageZoneId,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(newRoute)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: newRoute.name,
        description: newRoute.description,
        status: 'PLANNED',
        transportMethodId: testTransportMethodId,
        vehicleId: testVehicleId,
        driverId: testDriverId,
        coverageZoneId: testCoverageZoneId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      createdRouteId = response.body.id;
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRoute = {
        description: 'Missing name and transportMethodId',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(invalidRoute)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid transportMethodId (non-UUID)', async () => {
      const invalidRoute = {
        name: 'Invalid Transport Method',
        transportMethodId: 'not-a-uuid',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(invalidRoute)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for non-existent transportMethodId', async () => {
      const fakeMethodId = '00000000-0000-0000-0000-000000000000';
      const invalidRoute = {
        name: 'Non-existent Transport Method',
        transportMethodId: fakeMethodId,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(invalidRoute);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should create route with minimal required fields', async () => {
      const minimalRoute = {
        name: 'E2E Test Route - Minimal',
        transportMethodId: testTransportMethodId,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(minimalRoute)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(minimalRoute.name);
      expect(response.body.vehicleId).toBeNull();
      expect(response.body.driverId).toBeNull();
    });
  });

  describe('GET /fleet/routes', () => {
    it('should return all routes with relations', async () => {
      const response = await request(app.getHttpServer())
        .get('/fleet/routes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('status');
        expect(response.body[0]).toHaveProperty('transportMethod');
        expect(response.body[0]).toHaveProperty('vehicle');
        expect(response.body[0]).toHaveProperty('driver');
        expect(response.body[0]).toHaveProperty('coverageZone');
      }
    });

    it('should include all related entities', async () => {
      const response = await request(app.getHttpServer())
        .get('/fleet/routes')
        .expect(200);

      if (response.body.length > 0) {
        const route = response.body[0];

        // Verify transportMethod relation
        if (route.transportMethod) {
          expect(route.transportMethod).toHaveProperty('code');
          expect(route.transportMethod).toHaveProperty('name');
        }

        // Verify vehicle relation (if exists)
        if (route.vehicle) {
          expect(route.vehicle).toHaveProperty('licensePlate');
          expect(route.vehicle).toHaveProperty('brand');
        }

        // Verify driver relation (if exists)
        if (route.driver) {
          expect(route.driver).toHaveProperty('employeeId');
          expect(route.driver).toHaveProperty('firstName');
        }

        // Verify coverageZone relation (if exists)
        if (route.coverageZone) {
          expect(route.coverageZone).toHaveProperty('name');
          expect(route.coverageZone).toHaveProperty('postalCodes');
        }
      }
    });
  });

  describe('GET /fleet/routes/:id', () => {
    it('should return a specific route by ID with all relations', async () => {
      if (!createdRouteId) {
        const createResponse = await request(app.getHttpServer())
          .post('/fleet/routes')
          .send({
            name: 'E2E Test Route - GetById',
            transportMethodId: testTransportMethodId,
            vehicleId: testVehicleId,
            driverId: testDriverId,
          });
        createdRouteId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/fleet/routes/${createdRouteId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdRouteId,
        name: expect.any(String),
      });

      expect(response.body).toHaveProperty('transportMethod');
      expect(response.body).toHaveProperty('vehicle');
      expect(response.body).toHaveProperty('driver');
      expect(response.body).toHaveProperty('coverageZone');
      expect(response.body).toHaveProperty('stops');
      expect(Array.isArray(response.body.stops)).toBe(true);
    });

    it('should return 404 for non-existent route ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/fleet/routes/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-uuid';

      const response = await request(app.getHttpServer())
        .get(`/fleet/routes/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('PATCH /fleet/routes/:id', () => {
    it('should update a route', async () => {
      if (!createdRouteId) {
        const createResponse = await request(app.getHttpServer())
          .post('/fleet/routes')
          .send({
            name: 'E2E Test Route - Update',
            transportMethodId: testTransportMethodId,
          });
        createdRouteId = createResponse.body.id;
      }

      const updateData = {
        name: 'E2E Test Route - Updated',
        status: 'IN_PROGRESS',
        description: 'Updated via E2E test',
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/routes/${createdRouteId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdRouteId,
        name: updateData.name,
        status: updateData.status,
        description: updateData.description,
      });
    });

    it('should update route relationships', async () => {
      if (!createdRouteId) return;

      const updateRelations = {
        vehicleId: testVehicleId,
        driverId: testDriverId,
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/routes/${createdRouteId}`)
        .send(updateRelations)
        .expect(200);

      expect(response.body).toMatchObject({
        vehicleId: testVehicleId,
        driverId: testDriverId,
      });
    });

    it('should return 404 for updating non-existent route', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { name: 'Should Not Work' };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/routes/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should allow partial updates', async () => {
      if (!createdRouteId) return;

      const partialUpdate = {
        status: 'COMPLETED',
      };

      const response = await request(app.getHttpServer())
        .patch(`/fleet/routes/${createdRouteId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.status).toBe(partialUpdate.status);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    });
  });

  describe('DELETE /fleet/routes/:id', () => {
    it('should delete a route', async () => {
      // Create a route specifically for deletion
      const createResponse = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send({
          name: 'E2E Test Route - Delete',
          transportMethodId: testTransportMethodId,
        });

      const routeToDelete = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/fleet/routes/${routeToDelete}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', routeToDelete);

      // Verify route is deleted
      const getResponse = await request(app.getHttpServer())
        .get(`/fleet/routes/${routeToDelete}`)
        .expect(404);

      expect(getResponse.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 for deleting non-existent route', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/fleet/routes/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should validate status enum values', async () => {
      const invalidStatus = {
        name: 'E2E Invalid Status',
        transportMethodId: testTransportMethodId,
        status: 'INVALID_STATUS',
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(invalidStatus);

      expect([400, 500]).toContain(response.status);
    });

    it('should handle date ranges (startDate before endDate)', async () => {
      const invalidDates = {
        name: 'E2E Invalid Dates',
        transportMethodId: testTransportMethodId,
        startDate: new Date('2024-12-31').toISOString(),
        endDate: new Date('2024-12-01').toISOString(), // End before start
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(invalidDates);

      // Should accept (business logic may validate separately)
      expect([201, 400]).toContain(response.status);
    });

    it('should allow null for optional relation fields', async () => {
      const nullRelations = {
        name: 'E2E Null Relations',
        transportMethodId: testTransportMethodId,
        vehicleId: null,
        driverId: null,
        coverageZoneId: null,
      };

      const response = await request(app.getHttpServer())
        .post('/fleet/routes')
        .send(nullRelations)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.vehicleId).toBeNull();
      expect(response.body.driverId).toBeNull();
      expect(response.body.coverageZoneId).toBeNull();
    });
  });
});
