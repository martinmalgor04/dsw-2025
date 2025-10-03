import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.envioCalculo.deleteMany();
  await prisma.item.deleteMany();
  console.log('🧹 Datos existentes eliminados');

  // Crear items de ejemplo
  const items = await Promise.all([
    prisma.item.create({
      data: {
        name: 'Laptop Gaming',
        description: 'Laptop para gaming de alta gama con tarjeta gráfica dedicada',
      },
    }),
    prisma.item.create({
      data: {
        name: 'Smartphone',
        description: 'Teléfono inteligente con cámara de alta resolución',
      },
    }),
    prisma.item.create({
      data: {
        name: 'Tablet',
        description: 'Tablet para trabajo y entretenimiento',
      },
    }),
    prisma.item.create({
      data: {
        name: 'Auriculares Bluetooth',
        description: 'Auriculares inalámbricos con cancelación de ruido',
      },
    }),
    prisma.item.create({
      data: {
        name: 'Monitor 4K',
        description: 'Monitor de 27 pulgadas con resolución 4K',
      },
    }),
    prisma.item.create({
      data: {
        name: 'Teclado Mecánico',
        description: 'Teclado mecánico RGB para gaming',
      },
    }),
    prisma.item.create({
      data: {
        name: 'Mouse Gaming',
        description: 'Mouse inalámbrico con sensor óptico de alta precisión',
      },
    }),
    prisma.item.create({
      data: {
        name: 'Webcam HD',
        description: 'Cámara web de alta definición para videollamadas',
      },
    }),
  ]);

  console.log(`✅ ${items.length} items creados`);

  // Crear cálculos de envío de ejemplo
  const envioCalculos = await Promise.all([
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '1000',
        codigoPostalDestino: '2000',
        precio: 15000.50,
        volumen: 5,
        precioCalculado: 2500.75,
      },
    }),
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '1000',
        codigoPostalDestino: '3000',
        precio: 25000.00,
        volumen: 8,
        precioCalculado: 3200.00,
      },
    }),
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '2000',
        codigoPostalDestino: '4000',
        precio: 8500.25,
        volumen: 3,
        precioCalculado: 1800.50,
      },
    }),
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '3000',
        codigoPostalDestino: '5000',
        precio: 12000.00,
        volumen: 2,
        precioCalculado: 1500.00,
      },
    }),
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '1000',
        codigoPostalDestino: '6000',
        precio: 35000.75,
        volumen: 12,
        precioCalculado: 4500.25,
      },
    }),
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '4000',
        codigoPostalDestino: '7000',
        precio: 5000.00,
        volumen: 1,
        precioCalculado: 800.00,
      },
    }),
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '2000',
        codigoPostalDestino: '8000',
        precio: 18000.50,
        volumen: 6,
        precioCalculado: 2200.75,
      },
    }),
    prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen: '5000',
        codigoPostalDestino: '9000',
        precio: 7500.00,
        volumen: 4,
        precioCalculado: 1200.00,
      },
    }),
  ]);

  console.log(`✅ ${envioCalculos.length} cálculos de envío creados`);

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
