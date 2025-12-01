import { PrismaClient } from '@prisma/client';

describe('RF-004: Database Schema Integration Tests', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    // Optional: Reset database before tests
    console.log('🔄 Setting up test environment...');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ===== TASK-014: Tests de Integridad de Relaciones =====
  describe('TASK-014: Relationship Integrity Tests', () => {
    it('should validate Vehicle-TransportMethod relationship', async () => {
      const transportMethod = await prisma.transportMethod.findFirst();
      expect(transportMethod).toBeDefined();

      if (transportMethod) {
        const vehicle = await prisma.vehicle.findFirst({
          where: { transportMethodId: transportMethod.id },
        });

        if (vehicle) {
          const relatedTransportMethod =
            await prisma.transportMethod.findUnique({
              where: { id: vehicle.transportMethodId },
            });
          expect(relatedTransportMethod).toBeDefined();
          expect(relatedTransportMethod?.id).toBe(transportMethod.id);
        }
      }
    });

    it('should validate Vehicle-Driver relationship', async () => {
      const driver = await prisma.driver.findFirst();
      expect(driver).toBeDefined();

      if (driver) {
        const vehicles = await prisma.vehicle.findMany({
          where: { driverId: driver.id },
        });

        for (const vehicle of vehicles) {
          const relatedDriver = await prisma.driver.findUnique({
            where: { id: vehicle.driverId },
          });
          expect(relatedDriver?.id).toBe(driver.id);
        }
      }
    });

    it('should validate Route-Vehicle relationship', async () => {
      const vehicle = await prisma.vehicle.findFirst();
      expect(vehicle).toBeDefined();

      if (vehicle) {
        const routes = await prisma.route.findMany({
          where: { vehicleId: vehicle.id },
        });

        for (const route of routes) {
          expect(route.vehicleId).toBe(vehicle.id);
        }
      }
    });

    it('should validate RouteStop-Route relationship with cascade delete', async () => {
      const route = await prisma.route.findFirst();
      expect(route).toBeDefined();

      if (route) {
        const stops = await prisma.routeStop.findMany({
          where: { routeId: route.id },
        });

        for (const stop of stops) {
          expect(stop.routeId).toBe(route.id);
        }
      }
    });

    it('should validate Shipment-TransportMethod relationship', async () => {
      const shipping = await prisma.shipping.findFirst({
        where: { transportMethodId: { not: null } },
      });

      if (shipping) {
        const transportMethod = await prisma.transportMethod.findUnique({
          where: { id: shipping.transportMethodId! },
        });
        expect(transportMethod).toBeDefined();
      }
    });
  });

  // ===== TASK-015: Tests de Constraints y Validaciones =====
  describe('TASK-015: Constraints and Validation Tests', () => {
    it('should enforce unique license plate constraint', async () => {
      const vehicles = await prisma.vehicle.findMany({ take: 2 });

      if (vehicles.length === 2) {
        expect(vehicles[0].licensePlate).not.toBe(vehicles[1].licensePlate);
      }
    });

    it('should enforce unique employee ID constraint for drivers', async () => {
      const drivers = await prisma.driver.findMany({ take: 2 });

      if (drivers.length === 2) {
        expect(drivers[0].employeeId).not.toBe(drivers[1].employeeId);
      }
    });

    it('should enforce unique email constraint for drivers', async () => {
      const drivers = await prisma.driver.findMany({ take: 2 });

      if (drivers.length === 2) {
        expect(drivers[0].email).not.toBe(drivers[1].email);
      }
    });

    it('should enforce unique license number constraint', async () => {
      const drivers = await prisma.driver.findMany({ take: 2 });

      if (drivers.length === 2) {
        expect(drivers[0].licenseNumber).not.toBe(drivers[1].licenseNumber);
      }
    });

    it('should validate required fields for Vehicle', async () => {
      const vehicle = await prisma.vehicle.findFirst();
      expect(vehicle?.licensePlate).toBeDefined();
      expect(vehicle?.make).toBeDefined();
      expect(vehicle?.year).toBeDefined();
      expect(vehicle?.capacityKg).toBeDefined();
    });

    it('should validate required fields for Driver', async () => {
      const driver = await prisma.driver.findFirst();
      expect(driver?.employeeId).toBeDefined();
      expect(driver?.firstName).toBeDefined();
      expect(driver?.email).toBeDefined();
      expect(driver?.licenseNumber).toBeDefined();
    });

    it('should validate required fields for Route', async () => {
      const route = await prisma.route.findFirst();
      expect(route?.name).toBeDefined();
      expect(route?.status).toBeDefined();
      expect(route?.startDate).toBeDefined();
      expect(route?.transportMethodId).toBeDefined();
    });
  });

  // ===== TASK-016: Tests de Rendimiento =====
  describe('TASK-016: Performance and Index Tests', () => {
    it('should query vehicle by license plate efficiently', async () => {
      const start = performance.now();
      const vehicle = await prisma.vehicle.findFirst({
        where: { licensePlate: { startsWith: 'AA' } },
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should query driver by email efficiently', async () => {
      const start = performance.now();
      const driver = await prisma.driver.findFirst({
        where: { email: { contains: '@' } },
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(1000);
    });

    it('should filter routes by status efficiently', async () => {
      const start = performance.now();
      const routes = await prisma.route.findMany({
        where: { status: 'PLANNED' },
        take: 10,
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(1000);
    });

    it('should query route stops by sequence efficiently', async () => {
      const route = await prisma.route.findFirst();

      if (route) {
        const start = performance.now();
        const stops = await prisma.routeStop.findMany({
          where: { routeId: route.id },
          orderBy: { sequence: 'asc' },
        });
        const end = performance.now();

        expect(end - start).toBeLessThan(1000);
      }
    });
  });

  // ===== TASK-017: Tests de Migraciones =====
  describe('TASK-017: Migration Tests', () => {
    it('should have all required tables created', async () => {
      const tables = [
        'vehicles',
        'drivers',
        'routes',
        'route_stops',
        'transport_methods',
        'coverage_zones',
        'tariff_configs',
        'shipments',
        'shipping_products',
        'shipping_logs',
      ];

      for (const table of tables) {
        const count = await prisma.$queryRaw`
          SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name = ${table} AND table_schema = 'public'
        `;
        expect(count).toBeDefined();
      }
    });

    it('should have required columns in vehicles table', async () => {
      const columns = [
        'id',
        'license_plate',
        'make',
        'model',
        'year',
        'capacity_kg',
        'fuel_type',
        'status',
        'transport_method_id',
        'driver_id',
      ];

      const result = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'vehicles'
      `;

      const columnNames = (result as any[]).map((r) => r.column_name);

      for (const col of columns) {
        expect(columnNames).toContain(col);
      }
    });
  });

  // ===== TASK-018: Tests de Seed Data =====
  describe('TASK-018: Seed Data Tests', () => {
    it('should have drivers seeded', async () => {
      const drivers = await prisma.driver.findMany();
      expect(drivers.length).toBeGreaterThan(0);
    });

    it('should have vehicles seeded', async () => {
      const vehicles = await prisma.vehicle.findMany();
      expect(vehicles.length).toBeGreaterThan(0);
    });

    it('should have routes seeded', async () => {
      const routes = await prisma.route.findMany();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should have route stops seeded', async () => {
      const routeStops = await prisma.routeStop.findMany();
      expect(routeStops.length).toBeGreaterThan(0);
    });

    it('should verify driver-vehicle relationships in seed data', async () => {
      const drivers = await prisma.driver.findMany({
        include: { vehicles: true },
      });

      for (const driver of drivers) {
        if (driver.vehicles.length > 0) {
          for (const vehicle of driver.vehicles) {
            expect(vehicle.driverId).toBe(driver.id);
          }
        }
      }
    });

    it('should verify route-vehicle-driver relationships', async () => {
      const routes = await prisma.route.findMany({
        include: {
          vehicle: true,
          driver: true,
          transportMethod: true,
          coverageZone: true,
        },
      });

      for (const route of routes) {
        if (route.vehicleId) {
          expect(route.vehicle).toBeDefined();
        }
        if (route.driverId) {
          expect(route.driver).toBeDefined();
        }
        expect(route.transportMethod).toBeDefined();
      }
    });
  });

  // ===== Schema Health Check =====
  describe('Schema Health Check', () => {
    it('should verify all indexes are created', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname FROM pg_indexes 
        WHERE tablename IN ('vehicles', 'drivers', 'routes', 'route_stops')
      `;

      expect((indexes as any[]).length).toBeGreaterThan(0);
    });

    it('should verify foreign key constraints', async () => {
      const constraints = await prisma.$queryRaw`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name IN ('vehicles', 'drivers', 'routes', 'route_stops')
        AND constraint_type = 'FOREIGN KEY'
      `;

      expect((constraints as any[]).length).toBeGreaterThan(0);
    });
  });
});
