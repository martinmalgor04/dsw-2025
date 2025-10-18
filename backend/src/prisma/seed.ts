import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear métodos de transporte
  const transportMethods = [
    {
      type: 'AIR',
      name: 'Air Freight',
      estimatedDays: '1-3',
      baseCostPerKm: 5.0,
      baseCostPerKg: 2.5,
    },
    {
      type: 'ROAD',
      name: 'Road Transport',
      estimatedDays: '3-7',
      baseCostPerKm: 2.0,
      baseCostPerKg: 1.0,
    },
    {
      type: 'RAIL',
      name: 'Rail Freight',
      estimatedDays: '5-10',
      baseCostPerKm: 1.5,
      baseCostPerKg: 0.8,
    },
    {
      type: 'SEA',
      name: 'Sea Freight',
      estimatedDays: '15-30',
      baseCostPerKm: 0.8,
      baseCostPerKg: 0.5,
    },
  ];

  // Transport methods ya están insertados via MCP de Supabase
  // Ver RF-001: Servicio de Configuración Base
  console.log('⏭️  Transport methods ya insertados via MCP');
  
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
