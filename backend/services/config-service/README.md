# Config Service

Configuration service for the logistics platform. Manages transport methods, coverage zones, tariff configurations, and fleet operations (vehicles, drivers, routes).

## Table of Contents

- [Overview](#overview)
- [Responsibilities](#responsibilities)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Database Schema](#database-schema)
- [Technologies](#technologies)
- [Architecture](#architecture)

---

## Overview

**Config Service** is a core microservice responsible for managing all configuration and operational data for the logistics platform. It handles both system configuration (transport methods, zones, pricing) and fleet management (vehicles, drivers, routes).

**Port**: `3003`
**Type**: Domain Service
**Dependencies**: PostgreSQL (via Prisma)

---

## Responsibilities

### Configuration Module (`/config/*`)

1. **Transport Methods**: Define and manage transportation types (ground, air, sea)
   - Average speeds, estimated delivery times
   - Base costs per kilometer and kilogram
   - Active/inactive status
   - Volumetric weight factors

2. **Coverage Zones**: Geographic delivery areas
   - Zone names and descriptions
   - Postal code ranges
   - Active service areas
   - Zone-specific restrictions

3. **Tariff Configurations**: Pricing tiers and rules
   - Per transport method configurations
   - Distance-based pricing
   - Weight-based pricing
   - Special surcharges and discounts

### Fleet Module (`/fleet/*`)

4. **Vehicles**: Fleet vehicle management
   - Vehicle identification (plates, types)
   - Capacity specifications (weight, volume)
   - Maintenance schedules
   - Current status and availability

5. **Drivers**: Driver personnel management
   - Personal information (name, contact)
   - License information and expiry
   - Assignment history
   - Current availability

6. **Routes**: Delivery route planning
   - Route definitions and schedules
   - Vehicle and driver assignments
   - Coverage zone assignments
   - Route optimization data

---

## Prerequisites

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 14.x
- **Shared Libraries**: `@logistics/database`, `@logistics/types`, `@logistics/utils`

The service relies on NPM workspaces for shared dependencies. Ensure you run `npm install` from the **monorepo root** first.

---

## Installation

```bash
# 1. From monorepo root, install all dependencies
cd /path/to/dsw-2025
npm install

# 2. Generate Prisma client
cd backend/shared/database
npx prisma generate

# 3. Run database migrations
npx prisma migrate dev

# 4. Navigate to service directory
cd backend/services/config-service
```

---

## Configuration

### Environment Variables

Create a `.env` file in the service root:

```bash
# Server Configuration
PORT=3003
NODE_ENV=development

# Database (PostgreSQL via Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/logistics?schema=public

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:3005

# Logging
LOG_LEVEL=debug
```

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3003` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `NODE_ENV` | Environment (development/production) | `development` |

---

## Running the Service

### Development Mode

```bash
# From service directory
npm run start:dev

# The service will be available at:
# - API: http://localhost:3003
# - Swagger: http://localhost:3003/api/docs
```

### Production Mode

```bash
# Build the service
npm run build

# Run production server
npm run start:prod
```

### Docker

```bash
# Build Docker image
docker build -t config-service:latest .

# Run container
docker run -p 3003:3003 --env-file .env config-service:latest
```

---

## API Documentation

### Interactive Documentation

**Swagger UI**: [http://localhost:3003/api/docs](http://localhost:3003/api/docs)

The Swagger interface provides:
- Complete endpoint reference
- Request/response schemas
- Interactive API testing
- Example payloads

### Detailed API Reference

See [ENDPOINTS.md](./ENDPOINTS.md) for comprehensive documentation including:
- Full request/response examples
- Business rules and validation
- Error codes and handling
- Query parameters and filters
- Pagination details

### Endpoint Overview

#### Configuration Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/config/transport-methods` | List all transport methods |
| `POST` | `/config/transport-methods` | Create new transport method |
| `GET` | `/config/transport-methods/:id` | Get specific method |
| `PATCH` | `/config/transport-methods/:id` | Update method |
| `DELETE` | `/config/transport-methods/:id` | Soft delete method |
| `GET` | `/config/coverage-zones` | List all coverage zones |
| `POST` | `/config/coverage-zones` | Create new zone |
| `GET` | `/config/coverage-zones/:id` | Get specific zone |
| `PATCH` | `/config/coverage-zones/:id` | Update zone |
| `DELETE` | `/config/coverage-zones/:id` | Soft delete zone |
| `GET` | `/config/tariff-configs` | List tariff configurations |
| `POST` | `/config/tariff-configs` | Create tariff config |
| `GET` | `/config/tariff-configs/:id` | Get specific config |
| `PATCH` | `/config/tariff-configs/:id` | Update config |
| `DELETE` | `/config/tariff-configs/:id` | Delete config |

#### Fleet Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/fleet/vehicles` | List all vehicles |
| `POST` | `/fleet/vehicles` | Create new vehicle |
| `GET` | `/fleet/vehicles/:id` | Get specific vehicle |
| `PATCH` | `/fleet/vehicles/:id` | Update vehicle |
| `DELETE` | `/fleet/vehicles/:id` | Soft delete vehicle |
| `GET` | `/fleet/drivers` | List all drivers |
| `POST` | `/fleet/drivers` | Create new driver |
| `GET` | `/fleet/drivers/:id` | Get specific driver |
| `PATCH` | `/fleet/drivers/:id` | Update driver |
| `DELETE` | `/fleet/drivers/:id` | Soft delete driver |
| `GET` | `/fleet/routes` | List all routes |
| `POST` | `/fleet/routes` | Create new route |
| `GET` | `/fleet/routes/:id` | Get specific route |
| `PATCH` | `/fleet/routes/:id` | Update route |
| `DELETE` | `/fleet/routes/:id` | Soft delete route |

#### Health Check

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health status |
| `GET` | `/health/db` | Database connection check |

---

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Watch mode (useful for development)
npm run test:watch

# Coverage report
npm run test:cov
```

Unit tests are located in: `src/**/*.spec.ts`

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test file
npm run test:e2e coverage-zones.e2e-spec.ts
```

E2E tests are located in: `test/e2e/*.e2e-spec.ts`

**Available E2E test suites:**
- `coverage-zones.e2e-spec.ts` - Coverage zones CRUD operations
- `transport-methods.e2e-spec.ts` - Transport methods with decimal handling
- `tariff-configs.e2e-spec.ts` - Tariff configurations
- `drivers.e2e-spec.ts` - Driver management
- `vehicles.e2e-spec.ts` - Vehicle operations
- `routes.e2e-spec.ts` - Route planning with complex relations
- `health.e2e-spec.ts` - Health check endpoints

### Test Configuration

E2E tests use a dedicated Jest configuration: `test/jest-e2e.json`

- **Timeout**: 30 seconds per test
- **Environment**: Node.js
- **Database**: Uses same database with cleanup in `afterAll` hooks
- **Coverage**: Excluded DTOs, specs, and main.ts

---

## Database Schema

### Tables Managed

#### TransportMethod
```prisma
model TransportMethod {
  id              String   @id @default(uuid())
  code            String   @unique
  name            String
  description     String?
  averageSpeed    Int      // km/h
  estimatedDays   String
  baseCostPerKm   Decimal  @db.Decimal(10,2)
  baseCostPerKg   Decimal  @db.Decimal(10,2)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### CoverageZone
```prisma
model CoverageZone {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  postalCodes String[] // Array of postal codes
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### TariffConfig
```prisma
model TariffConfig {
  id                String          @id @default(uuid())
  transportMethodId String
  transportMethod   TransportMethod @relation(fields: [transportMethodId], references: [id])
  minWeight         Decimal?        @db.Decimal(10,2)
  maxWeight         Decimal?        @db.Decimal(10,2)
  pricePerKm        Decimal         @db.Decimal(10,2)
  pricePerKg        Decimal         @db.Decimal(10,2)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

#### Vehicle
```prisma
model Vehicle {
  id            String   @id @default(uuid())
  plate         String   @unique
  type          String
  capacity      Int      // kg
  fuelType      String
  status        String   @default("available")
  lastMaintenance DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Driver
```prisma
model Driver {
  id            String   @id @default(uuid())
  firstName     String
  lastName      String
  email         String   @unique
  phone         String
  licenseNumber String   @unique
  licenseExpiry DateTime
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Route
```prisma
model Route {
  id                String        @id @default(uuid())
  name              String
  description       String?
  transportMethodId String
  vehicleId         String?
  driverId          String?
  coverageZoneId    String
  transportMethod   TransportMethod @relation(fields: [transportMethodId], references: [id])
  vehicle           Vehicle?        @relation(fields: [vehicleId], references: [id])
  driver            Driver?         @relation(fields: [driverId], references: [id])
  coverageZone      CoverageZone    @relation(fields: [coverageZoneId], references: [id])
  isActive          Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

### Schema Location

The complete Prisma schema is located at: `backend/shared/database/prisma/schema.prisma`

### Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (DESTRUCTIVE - dev only)
npx prisma migrate reset
```

---

## Technologies

### Core Framework
- **NestJS 10**: Progressive Node.js framework
- **TypeScript 5.1**: Static typing and modern JavaScript features

### Database
- **Prisma ORM**: Type-safe database client
- **PostgreSQL 14+**: Relational database

### Validation & Documentation
- **class-validator**: DTO validation decorators
- **class-transformer**: Object transformation
- **Swagger/OpenAPI**: API documentation generation

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **@nestjs/testing**: NestJS testing utilities

### Development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Dotenv**: Environment variable management

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Controllers Layer           │  ← HTTP routing, validation
│  (coverage-zones, transport-methods,│
│   tariff-configs, vehicles,         │
│   drivers, routes)                  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│          Services Layer             │  ← Business logic
│  (domain rules, orchestration)      │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Infrastructure Layer           │  ← External dependencies
│  (PrismaService, Config, Logger)    │
└─────────────────────────────────────┘
```

### Design Patterns

1. **Repository Pattern**: PrismaService encapsulates data access
2. **Service Layer Pattern**: Business logic separated from controllers
3. **DTO Pattern**: Request/response data transfer objects
4. **Dependency Injection**: NestJS IoC container
5. **Soft Delete Pattern**: `isActive` flag instead of hard deletes

### Module Structure

```
src/
├── config/                    # Configuration module
│   ├── coverage-zones/        # Coverage zones sub-module
│   │   ├── coverage-zones.controller.ts
│   │   ├── coverage-zones.service.ts
│   │   ├── coverage-zones.service.spec.ts
│   │   └── dto/
│   ├── transport-methods/     # Transport methods sub-module
│   │   ├── transport-methods.controller.ts
│   │   ├── transport-methods.service.ts
│   │   └── dto/
│   ├── tariff-configs/        # Tariff configs sub-module
│   │   ├── tariff-configs.controller.ts
│   │   ├── tariff-configs.service.ts
│   │   └── dto/
│   └── config.module.ts
├── fleet/                     # Fleet management module
│   ├── vehicles/              # Vehicles sub-module
│   │   ├── vehicles.controller.ts
│   │   ├── vehicles.service.ts
│   │   └── dto/
│   ├── drivers/               # Drivers sub-module
│   │   ├── drivers.controller.ts
│   │   ├── drivers.service.ts
│   │   └── dto/
│   ├── routes/                # Routes sub-module
│   │   ├── routes.controller.ts
│   │   ├── routes.service.ts
│   │   └── dto/
│   └── fleet.module.ts
├── health/                    # Health check module
│   ├── health.controller.ts
│   └── health.service.ts
├── app.module.ts              # Root application module
└── main.ts                    # Application entry point
```

### Communication Patterns

- **Inbound**: HTTP REST API (JSON)
- **Outbound**: None (leaf service, no downstream dependencies)
- **Database**: PostgreSQL via Prisma (connection pooling)

### Error Handling

```typescript
// Standard NestJS exceptions
throw new NotFoundException(`Transport method ${id} not found`);
throw new BadRequestException('Invalid postal code format');
throw new ConflictException('Transport method code already exists');
```

### Logging

```typescript
// Structured logging with context
this.logger.log(`Created transport method: ${method.name}`);
this.logger.warn(`Inactive transport method requested: ${id}`);
this.logger.error(`Failed to update vehicle: ${error.message}`, error.stack);
```

---

## Development Workflow

### Adding a New Endpoint

1. **Define DTO** in `dto/` directory:
```typescript
export class CreateTransportMethodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
  // ... other fields
}
```

2. **Add Service Method**:
```typescript
async create(dto: CreateTransportMethodDto): Promise<TransportMethod> {
  return this.prisma.transportMethod.create({ data: dto });
}
```

3. **Add Controller Endpoint**:
```typescript
@Post()
@ApiOperation({ summary: 'Create transport method' })
async create(@Body() dto: CreateTransportMethodDto) {
  return this.service.create(dto);
}
```

4. **Write Tests**:
```typescript
describe('POST /config/transport-methods', () => {
  it('should create a new transport method', async () => {
    // test implementation
  });
});
```

### Code Style

- Use `async/await` for asynchronous operations
- Prefix private methods with underscore: `_validateInput()`
- Use descriptive variable names: `transportMethod` not `tm`
- Add JSDoc comments for complex business logic
- Keep controller methods thin (delegate to services)

### Git Workflow

1. Create feature branch: `feature/add-xyz`
2. Implement changes with unit tests
3. Run linter: `npm run lint`
4. Run tests: `npm run test` && `npm run test:e2e`
5. Commit with conventional commits: `feat: add xyz endpoint`
6. Push and create PR to `dev` branch

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3003
lsof -i :3003

# Kill process
kill -9 <PID>
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection manually
psql $DATABASE_URL

# Regenerate Prisma client
cd backend/shared/database
npx prisma generate
```

### Prisma Migration Issues

```bash
# Check migration status
npx prisma migrate status

# Reset database (development only!)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev
```

### Module Resolution Errors

```bash
# Ensure you're using NPM workspaces
npm --version  # Should be >= 9.x

# Clear and reinstall from root
rm -rf node_modules package-lock.json
cd /path/to/dsw-2025
npm install
```

---

## Related Documentation

- **API Endpoints**: [ENDPOINTS.md](./ENDPOINTS.md)
- **Architecture**: [backend/docs/architecture/README.md](../../docs/architecture/README.md)
- **Database Schema**: [backend/docs/database/README.md](../../docs/database/README.md)
- **Deployment**: [backend/docs/deployment/README.md](../../docs/deployment/README.md)

---

## Contributing

This service is part of the **Grupo 12 - UTN FRRE** logistics platform project.

**Maintainers**: Grupo 12
**License**: Apache 2.0
**Repository**: https://github.com/grupos-12/logistica

---

**Last Updated**: November 6, 2025
**Service Version**: 1.0.0
