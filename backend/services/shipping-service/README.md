# Shipping Service

Core logistics service for shipping operations. Handles cost calculation, shipment creation, tracking, and cancellation with integrated product validation and distance-based pricing.

## Table of Contents

- [Overview](#overview)
- [Responsibilities](#responsibilities)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Business Logic](#business-logic)
- [Integrations](#integrations)
- [Technologies](#technologies)
- [Architecture](#architecture)

---

## Overview

**Shipping Service** is the core domain service for logistics operations. It calculates shipping costs based on distance, weight (including volumetric weight), and transport methods, creates and manages shipments, provides tracking capabilities, and handles cancellations.

**Port**: `3001`
**Type**: Domain Service (Core Business Logic)
**Dependencies**: PostgreSQL, Config Service, Stock Integration Service

---

## Responsibilities

### 1. Cost Calculation (`POST /shipping/cost`)

Calculate shipping costs considering:
- **Distance**: Haversine formula for geographic distance
- **Weight**: Actual weight vs volumetric weight (whichever is greater)
- **Transport Method**: Different pricing per method (ground, air, sea)
- **Tariff Configuration**: Per-kilometer and per-kilogram rates
- **Product Validation**: Verify products exist via Stock Service

**Formula**:
```
Volumetric Weight = (Length × Width × Height) / 5000
Chargeable Weight = max(Actual Weight, Volumetric Weight)

Cost = (Distance × Rate per KM) + (Chargeable Weight × Rate per KG)
```

### 2. Shipment Creation (`POST /shipping`)

Create complete shipments with:
- Origin and destination addresses
- Product list with quantities
- Selected transport method
- Unique tracking number generation
- Initial status: `PENDING`
- Cost calculation included

### 3. Shipment Management

- **List Shipments** (`GET /shipping`): Paginated list with filters (status, dateFrom, dateTo)
- **Get Shipment** (`GET /shipping/:id`): Retrieve specific shipment details
- **Cancel Shipment** (`PATCH /shipping/:id/cancel`): Update status to `CANCELLED`

### 4. Tracking

- **Get Tracking** (`GET /shipping/:id/tracking`): Retrieve full tracking history
- Tracking events include: created, in_transit, out_for_delivery, delivered, cancelled

### 5. Quote Management

- Generate unique quote IDs
- Cache cost calculations (5-minute TTL)
- Return detailed breakdown (distance, weight, rates, total)

---

## Prerequisites

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 14.x
- **Config Service**: Running on port 3003
- **Stock Integration Service**: Running on port 3002
- **Shared Libraries**: `@logistics/database`, `@logistics/types`, `@logistics/utils`

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
cd backend/services/shipping-service
```

---

## Configuration

### Environment Variables

Create a `.env` file in the service root:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (PostgreSQL via Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/logistics?schema=public

# Service Dependencies
CONFIG_SERVICE_URL=http://localhost:3003
STOCK_SERVICE_URL=http://localhost:3002

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:3005

# Cache Configuration
CACHE_TTL=300000  # 5 minutes in milliseconds

# Logging
LOG_LEVEL=debug
```

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `CONFIG_SERVICE_URL` | Config Service base URL | `http://localhost:3003` |
| `STOCK_SERVICE_URL` | Stock Integration Service URL | `http://localhost:3002` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `CACHE_TTL` | Quote cache TTL (ms) | `300000` |

---

## Running the Service

### Development Mode

```bash
# From service directory
npm run start:dev

# The service will be available at:
# - API: http://localhost:3001
# - Swagger: http://localhost:3001/api/docs
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
docker build -t shipping-service:latest .

# Run container
docker run -p 3001:3001 --env-file .env shipping-service:latest
```

---

## API Documentation

### Interactive Documentation

**Swagger UI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Detailed API Reference

See [ENDPOINTS.md](./ENDPOINTS.md) for comprehensive documentation.

### Endpoint Overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/shipping/cost` | Calculate shipping cost |
| `POST` | `/shipping` | Create new shipment |
| `GET` | `/shipping` | List all shipments (with filters) |
| `GET` | `/shipping/:id` | Get specific shipment |
| `PATCH` | `/shipping/:id/cancel` | Cancel shipment |
| `GET` | `/shipping/:id/tracking` | Get tracking history |
| `GET` | `/health` | Service health check |

---

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

Unit tests are located in: `src/**/*.spec.ts`

**Test Coverage**:
- ✅ `shipping.service.spec.ts` - Business logic (cost calculation, volumetric weight)
- ✅ `tracking.service.spec.ts` - Tracking event creation

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e shipping-cost.e2e-spec.ts
```

E2E tests are located in: `test/e2e/*.e2e-spec.ts`

**Available E2E test suites:**
- `shipping-cost.e2e-spec.ts` - Cost calculation with volumetric weight, multiple products, edge cases
- `shipping-operations.e2e-spec.ts` - CRUD operations, filters, cancellation
- `health.e2e-spec.ts` - Health check endpoint

### Test Configuration

E2E tests use: `test/jest-e2e.json`
- **Timeout**: 30 seconds per test
- **Database**: Uses same database with cleanup in `afterAll` hooks

---

## Business Logic

### Cost Calculation Algorithm

```typescript
// 1. Validate products with Stock Service
const products = await this.stockService.validateProducts(productIds);

// 2. Calculate total weight
const actualWeight = products.reduce((sum, p) => sum + p.weight * p.quantity, 0);

// 3. Calculate volumetric weight
const volumetricWeight = products.reduce((sum, p) => {
  const vol = (p.length * p.width * p.height) / 5000; // IATA standard
  return sum + vol * p.quantity;
}, 0);

// 4. Use higher weight
const chargeableWeight = Math.max(actualWeight, volumetricWeight);

// 5. Calculate distance (Haversine formula)
const distance = geolib.getDistance(origin, destination) / 1000; // km

// 6. Get transport method rates from Config Service
const method = await this.configService.getTransportMethod(transportType);

// 7. Apply rates
const distanceCost = distance * method.baseCostPerKm;
const weightCost = chargeableWeight * method.baseCostPerKg;

// 8. Total
const totalCost = distanceCost + weightCost;
```

### Volumetric Weight Calculation

Based on **IATA Standard** (International Air Transport Association):

```
Volumetric Weight (kg) = (Length × Width × Height in cm) / 5000
```

The divisor (5000) represents the volumetric conversion factor. This is industry standard for air freight.

**Example**:
- Box: 100cm × 100cm × 100cm = 1,000,000 cm³
- Volumetric Weight: 1,000,000 / 5000 = 200 kg
- If actual weight is only 50 kg, chargeable weight = 200 kg (volumetric is higher)

### Tracking Number Generation

Format: `SHIP-{TIMESTAMP}-{RANDOM}`

Example: `SHIP-1699286400000-A3F9`

- **SHIP**: Prefix
- **Timestamp**: Unix timestamp (milliseconds)
- **Random**: 4 alphanumeric characters

### Status Flow

```
PENDING → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
           ↓
        CANCELLED (terminal status)
```

### Caching Strategy

**Quote Caching**:
- **TTL**: 5 minutes (300,000 ms)
- **Key**: Hash of (origin, destination, products, transportType)
- **Storage**: In-memory cache (CacheModule)
- **Invalidation**: Automatic TTL expiration

**Benefits**:
- Reduces load on Config/Stock services
- Faster response for identical quotes
- Cost-effective for high-volume quote requests

---

## Integrations

### Config Service Integration

**Base URL**: `http://localhost:3003`

**Endpoints Used**:
1. `GET /config/transport-methods` - Retrieve available transport methods
2. `GET /config/transport-methods/:id` - Get specific method rates
3. `GET /config/coverage-zones` - Validate origin/destination zones

**Timeout**: 5 seconds
**Retry**: 2 attempts with 1-second delay

**Error Handling**:
- Config Service down → Return `503 Service Unavailable`
- Transport method not found → Return `404 Not Found`

### Stock Integration Service

**Base URL**: `http://localhost:3002`

**Endpoints Used**:
1. `POST /stock/products/batch` - Validate product IDs and retrieve details

**Request Format**:
```json
{
  "productIds": ["PROD-001", "PROD-002"]
}
```

**Response Format**:
```json
{
  "products": [
    {
      "id": "PROD-001",
      "name": "Product Name",
      "weight": 2.5,
      "dimensions": { "length": 30, "width": 20, "height": 10 },
      "available": true
    }
  ]
}
```

**Error Handling**:
- Stock Service down → Circuit breaker fallback
- Product not found → Return `400 Bad Request` with missing product IDs

---

## Technologies

### Core Framework
- **NestJS 10**: Progressive Node.js framework
- **TypeScript 5.1**: Static typing

### Dependencies
- **Prisma ORM**: Database access
- **Geolib 3.3.4**: Distance calculation (Haversine formula)
- **@nestjs/axios**: HTTP client for service-to-service communication
- **@nestjs/cache-manager**: In-memory caching

### Validation & Documentation
- **class-validator**: DTO validation
- **class-transformer**: Object transformation
- **Swagger/OpenAPI**: API documentation

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│      Controllers Layer              │  ← HTTP routing, validation
│   (shipping.controller.ts)          │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Services Layer                │  ← Business logic
│   (shipping.service.ts,             │
│    tracking.service.ts)             │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│    Integration Layer                │  ← External services
│   (config-client.service.ts,        │
│    stock-client.service.ts)         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   Infrastructure Layer              │  ← Prisma, Cache, HTTP
└─────────────────────────────────────┘
```

### Design Patterns

1. **Service Layer Pattern**: Business logic in dedicated service classes
2. **Repository Pattern**: PrismaService for data access
3. **DTO Pattern**: Typed request/response objects
4. **Client Service Pattern**: Dedicated clients for external services
5. **Cache-Aside Pattern**: Check cache before external calls
6. **Dependency Injection**: NestJS IoC container

### Module Structure

```
src/
├── shipping/
│   ├── shipping.controller.ts       # HTTP endpoints
│   ├── shipping.service.ts          # Core business logic
│   ├── shipping.service.spec.ts     # Unit tests
│   ├── tracking.service.ts          # Tracking logic
│   ├── dto/
│   │   ├── calculate-cost.dto.ts    # Cost calculation request
│   │   ├── create-shipment.dto.ts   # Shipment creation request
│   │   └── query-shipment.dto.ts    # List filters
│   └── shipping.module.ts
├── clients/
│   ├── config-client.service.ts     # Config Service HTTP client
│   └── stock-client.service.ts      # Stock Service HTTP client
├── health/
│   ├── health.controller.ts
│   └── health.service.ts
├── app.module.ts
└── main.ts
```

### Communication Patterns

- **Inbound**: HTTP REST API (JSON)
- **Outbound**:
  - Config Service: HTTP GET (transport methods, zones)
  - Stock Service: HTTP POST (product validation)
- **Database**: PostgreSQL via Prisma
- **Cache**: In-memory (@nestjs/cache-manager)

### Error Handling

```typescript
// Domain exceptions
throw new BadRequestException('Invalid transport type');
throw new NotFoundException(`Shipment ${id} not found`);

// Integration errors
throw new ServiceUnavailableException('Config Service is down');
throw new BadGatewayException('Failed to validate products');
```

### Logging

```typescript
// Structured logging
this.logger.log(`Calculating cost for ${products.length} products`);
this.logger.warn(`Volumetric weight (${volWeight}) > actual weight (${actualWeight})`);
this.logger.error(`Failed to fetch transport method: ${error.message}`);
```

---

## Development Workflow

### Adding a New Calculation Rule

1. **Update Service Logic**:
```typescript
// shipping.service.ts
private applyCustomRule(cost: number, shipment: any): number {
  // New business rule
  return cost * discountFactor;
}
```

2. **Add Unit Test**:
```typescript
describe('Custom Rule', () => {
  it('should apply discount for bulk shipments', () => {
    // test implementation
  });
});
```

3. **Update E2E Test**:
```typescript
it('POST /shipping/cost with bulk products should apply discount', async () => {
  // integration test
});
```

### Code Style

- Use `async/await` for async operations
- Prefix private methods with underscore: `_calculateDistance()`
- Keep controller methods thin (delegate to services)
- Add JSDoc for complex algorithms (e.g., volumetric weight)
- Use descriptive variable names: `chargeableWeight` not `cw`

### Git Workflow

1. Feature branch: `feature/add-xyz`
2. Implement with tests
3. Run linter: `npm run lint`
4. Run tests: `npm run test && npm run test:e2e`
5. Commit: `feat: add xyz feature`
6. PR to `dev`

---

## Troubleshooting

### Port Already in Use

```bash
lsof -i :3001
kill -9 <PID>
```

### Service Integration Errors

**Config Service Unreachable**:
```bash
# Verify Config Service is running
curl http://localhost:3003/health

# Check environment variable
echo $CONFIG_SERVICE_URL
```

**Stock Service Unreachable**:
```bash
# Verify Stock Integration is running
curl http://localhost:3002/health

# Check circuit breaker status in logs
```

### Database Connection Errors

```bash
# Test database connection
psql $DATABASE_URL

# Regenerate Prisma client
cd backend/shared/database
npx prisma generate
```

### Cache Issues

```bash
# Clear in-memory cache by restarting service
npm run start:dev

# Check cache configuration in app.module.ts
# Verify CACHE_TTL environment variable
```

### Distance Calculation Errors

```bash
# Verify coordinates are valid
# Latitude: -90 to 90
# Longitude: -180 to 180

# Check geolib dependency
npm list geolib
```

---

## Performance Considerations

### Caching

- Quote caching reduces external service calls by ~70%
- 5-minute TTL balances freshness vs performance
- Consider Redis for distributed caching in production

### Database Queries

- Indexed fields: `id`, `trackingNumber`, `status`, `createdAt`
- Pagination for list endpoints (default: 20 items)
- Avoid N+1 queries with Prisma `include`

### External Service Calls

- Parallel calls to Config/Stock when possible
- Timeouts prevent hanging requests (5s default)
- Circuit breaker for Stock Service (handled by Stock Integration)

### Scalability

- Stateless design allows horizontal scaling
- Shared Prisma connection pool (max: 10 connections)
- Consider message queue for shipment creation (future)

---

## Related Documentation

- **API Endpoints**: [ENDPOINTS.md](./ENDPOINTS.md)
- **Architecture**: [backend/docs/architecture/README.md](../../docs/architecture/README.md)
- **Database Schema**: [backend/docs/database/README.md](../../docs/database/README.md)
- **Geolocation**: [backend/docs/geolocation/README.md](../../docs/geolocation/README.md)
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
