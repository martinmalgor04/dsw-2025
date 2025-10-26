// Re-export Prisma client types and utilities
export * from '@prisma/client';

// Export our custom services and modules
export { PrismaService } from './prisma.service';
export { PrismaModule } from './prisma.module';

// Export enums from Prisma schema
// Los enums no existen en el schema actual
// export { TransportType, ShippingStatus } from '@prisma/client';
