import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Obtener IDs de métodos de transporte existentes
  const transportMethods = await prisma.transportMethod.findMany({
    take: 2,
  });

  if (transportMethods.length === 0) {
    console.log('❌ No transport methods found. Skipping seed.');
    return;
  }

  // Obtener ID de zona de cobertura existente
  const coverageZones = await prisma.coverageZone.findMany({
    take: 1,
  });

  if (coverageZones.length === 0) {
    console.log('❌ No coverage zones found. Skipping seed.');
    return;
  }

  console.log(
    '✅ Transport methods and coverage zones found. Starting seed...',
  );

  // ===== SEED: Drivers =====
  console.log('🚗 Seeding drivers...');
  const drivers = await prisma.driver.createMany({
    data: [
      {
        employeeId: 'DRV-001',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@logistica.com',
        phone: '+54-11-1234-5678',
        licenseNumber: 'ARG123456789',
        licenseType: 'D',
        status: 'ACTIVE',
      },
      {
        employeeId: 'DRV-002',
        firstName: 'María',
        lastName: 'García',
        email: 'maria.garcia@logistica.com',
        phone: '+54-11-2234-5678',
        licenseNumber: 'ARG987654321',
        licenseType: 'C',
        status: 'ACTIVE',
      },
      {
        employeeId: 'DRV-003',
        firstName: 'Carlos',
        lastName: 'López',
        email: 'carlos.lopez@logistica.com',
        phone: '+54-11-3234-5678',
        licenseNumber: 'ARG456789123',
        licenseType: 'D',
        status: 'ACTIVE',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${drivers.count} drivers`);

  // Get driver IDs
  const createdDrivers = await prisma.driver.findMany({
    take: 3,
  });

  // ===== SEED: Vehicles =====
  console.log('🚛 Seeding vehicles...');
  const vehicles = await prisma.vehicle.createMany({
    data: [
      {
        licensePlate: 'AA-001-BB',
        make: 'Scania',
        model: 'R440',
        year: 2023,
        capacityKg: 25000,
        volumeM3: 80.5,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
        transportMethodId: transportMethods[0].id,
        driverId: createdDrivers[0]?.id,
      },
      {
        licensePlate: 'AA-002-BB',
        make: 'Volvo',
        model: 'FH16',
        year: 2022,
        capacityKg: 22000,
        volumeM3: 75.0,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
        transportMethodId: transportMethods[0].id,
        driverId: createdDrivers[1]?.id,
      },
      {
        licensePlate: 'AA-003-BB',
        make: 'Mercedes',
        model: 'Actros',
        year: 2021,
        capacityKg: 18000,
        volumeM3: 60.0,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
        transportMethodId: transportMethods[1].id,
        driverId: createdDrivers[2]?.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${vehicles.count} vehicles`);

  // Get vehicle IDs
  const createdVehicles = await prisma.vehicle.findMany({
    take: 3,
  });

  // ===== SEED: Routes =====
  console.log('🛣️ Seeding routes...');
  const routes = await prisma.route.createMany({
    data: [
      {
        name: 'Ruta Buenos Aires - Córdoba',
        description: 'Ruta norte conectando CABA con Córdoba',
        status: 'PLANNED',
        startDate: new Date('2025-10-25'),
        endDate: new Date('2025-10-27'),
        transportMethodId: transportMethods[0].id,
        vehicleId: createdVehicles[0]?.id,
        driverId: createdDrivers[0]?.id,
        coverageZoneId: coverageZones[0].id,
      },
      {
        name: 'Ruta Buenos Aires - Rosario',
        description: 'Ruta sur conectando CABA con Rosario',
        status: 'PLANNED',
        startDate: new Date('2025-10-26'),
        endDate: new Date('2025-10-26'),
        transportMethodId: transportMethods[1].id,
        vehicleId: createdVehicles[1]?.id,
        driverId: createdDrivers[1]?.id,
        coverageZoneId: coverageZones[0].id,
      },
      {
        name: 'Ruta Mendoza - San Juan',
        description: 'Ruta oeste conectando Mendoza con San Juan',
        status: 'IN_PROGRESS',
        startDate: new Date('2025-10-20'),
        endDate: new Date('2025-10-28'),
        transportMethodId: transportMethods[0].id,
        vehicleId: createdVehicles[2]?.id,
        driverId: createdDrivers[2]?.id,
        coverageZoneId: coverageZones[0].id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${routes.count} routes`);

  // Get route IDs
  const createdRoutes = await prisma.route.findMany({
    take: 3,
  });

  // ===== SEED: Route Stops =====
  console.log('🛑 Seeding route stops...');
  let totalStops = 0;

  for (const route of createdRoutes) {
    const stops = await prisma.routeStop.createMany({
      data: [
        {
          routeId: route.id,
          sequence: 1,
          type: 'PICKUP',
          address: {
            street: 'Av. Libertador 1000',
            city: 'Buenos Aires',
            state: 'CABA',
            postalCode: 'C1001',
            country: 'AR',
          },
          coordinates: {
            lat: -34.6037,
            lng: -58.3816,
          },
          scheduledTime: new Date('2025-10-25T08:00:00'),
          status: 'PENDING',
        },
        {
          routeId: route.id,
          sequence: 2,
          type: 'DELIVERY',
          address: {
            street: 'Av. San Martín 500',
            city: 'Rosario',
            state: 'Santa Fe',
            postalCode: 'S2000',
            country: 'AR',
          },
          coordinates: {
            lat: -32.9388,
            lng: -60.6633,
          },
          scheduledTime: new Date('2025-10-26T16:00:00'),
          status: 'PENDING',
        },
        {
          routeId: route.id,
          sequence: 3,
          type: 'DELIVERY',
          address: {
            street: 'Calle Mitre 800',
            city: 'Córdoba',
            state: 'Córdoba',
            postalCode: 'X5000',
            country: 'AR',
          },
          coordinates: {
            lat: -31.4166,
            lng: -64.1889,
          },
          scheduledTime: new Date('2025-10-27T14:00:00'),
          status: 'PENDING',
        },
      ],
      skipDuplicates: true,
    });
    totalStops += stops.count;
  }
  console.log(`✅ Created ${totalStops} route stops`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
