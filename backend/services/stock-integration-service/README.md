# Stock Integration Service

Internal HTTP client service for integration with the external Stock module (Group 11). Provides resilient communication with circuit breaker, automatic retries, Redis caching, and fallback mechanisms.

## Table of Contents

- [Overview](#overview)
- [Responsibilities](#responsibilities)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Resilience Patterns](#resilience-patterns)
- [Caching Strategy](#caching-strategy)
- [Monitoring](#monitoring)
- [Technologies](#technologies)
- [Architecture](#architecture)

---

## Overview

**Stock Integration Service** is an internal HTTP client that provides a resilient interface to the external Stock API. It implements enterprise-grade reliability patterns including circuit breaker, retry logic, and caching to ensure the logistics platform continues operating even when the Stock service experiences issues.

**Port**: `3002`
**Type**: Integration Service (Internal)
**Dependencies**: Redis, External Stock API

**Important**: This service is **NOT** a public API. It's consumed internally by other microservices (primarily Shipping Service).

---

## Responsibilities

### 1. Product Validation

**Endpoint**: `POST /stock/products/batch`

Validate product IDs and retrieve product details including:
- Product name and description
- Weight (for shipping calculations)
- Dimensions (length, width, height)
- Availability status

### 2. Inventory Queries

**Endpoint**: `GET /stock/availability/:productId`

Check real-time product availability for a specific SKU.

### 3. Reservation Management

**Endpoint**: `POST /stock/reservations`

Create inventory reservations for confirmed shipments (prevents overselling).

### 4. Circuit Breaker Management

Monitor external API health and automatically:
- **OPEN** circuit when failure threshold reached
- **HALF_OPEN** after cooldown period for testing
- **CLOSED** when service recovers

### 5. Health Monitoring

**Endpoint**: `GET /health`

Comprehensive health check including:
- Service status
- Redis connection
- Circuit breaker state
- External API reachability
- Last successful request timestamp

---

## Prerequisites

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **Redis**: >= 6.x (for caching)
- **External Stock API**: Accessible and responding
- **Shared Libraries**: `@logistics/types`, `@logistics/utils`

---

## Installation

```bash
# 1. From monorepo root, install all dependencies
cd /path/to/dsw-2025
npm install

# 2. Ensure Redis is running
docker run -d -p 6379:6379 redis:7-alpine
# OR via docker-compose
docker-compose up -d redis

# 3. Navigate to service directory
cd backend/services/stock-integration-service
```

---

## Configuration

### Environment Variables

Create a `.env` file in the service root:

```bash
# Server Configuration
PORT=3002
NODE_ENV=development

# External Stock API
STOCK_API_URL=http://external-stock-api.com
STOCK_API_TIMEOUT=10000        # 10 seconds
STOCK_API_KEY=your-api-key     # Optional authentication

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                 # Optional
CACHE_TTL=300                   # 5 minutes

# Circuit Breaker Configuration
CIRCUIT_BREAKER_THRESHOLD=5     # Failures before opening
CIRCUIT_BREAKER_TIMEOUT=30000   # 30 seconds cooldown
CIRCUIT_BREAKER_RESET_TIMEOUT=60000  # 60 seconds before retry

# Retry Policy
RETRY_ATTEMPTS=3
RETRY_DELAY=1000                # 1 second
RETRY_BACKOFF_MULTIPLIER=2      # Exponential backoff

# Logging
LOG_LEVEL=debug
```

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3002` |
| `STOCK_API_URL` | External Stock API base URL | - |
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `CACHE_TTL` | Cache time-to-live (seconds) | `300` |
| `CIRCUIT_BREAKER_THRESHOLD` | Failures before circuit opens | `5` |
| `RETRY_ATTEMPTS` | Max retry attempts | `3` |

---

## Running the Service

### Development Mode

```bash
# From service directory
npm run start:dev

# The service will be available at:
# - API: http://localhost:3002
# - Swagger: http://localhost:3002/api/docs
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
docker build -t stock-integration-service:latest .

# Run container with Redis link
docker run -p 3002:3002 \
  --link redis:redis \
  --env-file .env \
  stock-integration-service:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  stock-integration:
    build: .
    ports:
      - "3002:3002"
    depends_on:
      - redis
    environment:
      REDIS_HOST: redis
      STOCK_API_URL: http://external-stock-api.com
```

---

## API Documentation

### Interactive Documentation

**Swagger UI**: [http://localhost:3002/api/docs](http://localhost:3002/api/docs)

### Detailed API Reference

See [ENDPOINTS.md](./ENDPOINTS.md) for comprehensive internal documentation.

### Endpoint Overview

| Method | Path | Description | Public |
|--------|------|-------------|--------|
| `POST` | `/stock/products/batch` | Validate multiple products | Internal |
| `GET` | `/stock/availability/:productId` | Check product availability | Internal |
| `POST` | `/stock/reservations` | Create inventory reservation | Internal |
| `GET` | `/health` | Service health check | Yes |

**Note**: All endpoints except `/health` are internal and should only be accessed by other microservices within the platform.

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
- ✅ `stock-client.service.spec.ts` - HTTP client logic
- ✅ `circuit-breaker.service.spec.ts` - Circuit breaker state machine
- ✅ `cache.service.spec.ts` - Redis caching logic
- ✅ `retry.service.spec.ts` - Retry policy with backoff

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e health.e2e-spec.ts
```

E2E tests are located in: `test/e2e/*.e2e-spec.ts`

**Available E2E test suites:**
- `health.e2e-spec.ts` - Health check with circuit breaker status

### Test Configuration

E2E tests use: `test/jest-e2e.json`
- **Timeout**: 30 seconds per test
- **Redis**: Uses test Redis instance (or same instance with cleanup)

---

## Resilience Patterns

### Circuit Breaker

**Purpose**: Prevent cascading failures by failing fast when external service is down.

**States**:

1. **CLOSED** (Normal Operation)
   - All requests pass through to external API
   - Tracks failure count
   - Opens circuit when threshold reached

2. **OPEN** (Fail Fast)
   - Immediately rejects requests without calling API
   - Returns fallback response or cached data
   - Waits for cooldown period

3. **HALF_OPEN** (Testing Recovery)
   - Allows limited test requests through
   - Closes circuit if requests succeed
   - Reopens if requests still failing

**Configuration**:
```typescript
{
  threshold: 5,              // Open after 5 consecutive failures
  timeout: 30000,            // Stay open for 30 seconds
  resetTimeout: 60000,       // Full reset after 60 seconds success
}
```

**Metrics Tracked**:
- Total requests
- Successful requests
- Failed requests
- Circuit state changes
- Last state change timestamp

### Retry Policy

**Strategy**: Exponential backoff with jitter

**Configuration**:
```typescript
{
  attempts: 3,               // Max 3 retry attempts
  delay: 1000,               // Start with 1 second
  backoffMultiplier: 2,      // Double delay each time
  maxDelay: 10000,           // Cap at 10 seconds
}
```

**Retry Schedule**:
1. Initial attempt: 0ms
2. First retry: 1000ms (1s)
3. Second retry: 2000ms (2s)
4. Third retry: 4000ms (4s)

**Retry Conditions**:
- Network errors (ECONNREFUSED, ETIMEDOUT)
- HTTP 5xx errors (except 501 Not Implemented)
- Timeout errors

**No Retry**:
- HTTP 4xx errors (client errors)
- HTTP 200-299 (success)
- Circuit breaker OPEN

### Timeout Configuration

```typescript
{
  request: 10000,            // 10s per request
  connection: 5000,          // 5s to establish connection
  idle: 30000,               // 30s max idle time
}
```

### Fallback Mechanisms

When external API fails and cache misses:

1. **Cached Response**: Return stale cache if available (up to 1 hour old)
2. **Mock Response**: Return mock product data (development only)
3. **Degraded Response**: Return partial data with warning flags
4. **Error Response**: 503 Service Unavailable with retry-after header

---

## Caching Strategy

### Redis Configuration

**Connection**:
```typescript
{
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
}
```

### Cache Keys

**Format**: `stock:<resource>:<id>:<hash>`

Examples:
- `stock:product:PROD-001:a3f9b2c1`
- `stock:availability:PROD-002:e7d4a8f3`
- `stock:batch:abc123def456:f9e2c7b1`

### Cache TTL

| Resource | TTL | Reason |
|----------|-----|--------|
| Product Details | 5 minutes | Balanced freshness |
| Availability | 1 minute | Frequently changing |
| Batch Validation | 5 minutes | Consistent with details |

### Cache Invalidation

**Automatic**:
- TTL expiration (primary method)
- Redis memory eviction (LRU policy)

**Manual** (future):
- Product update webhooks from Stock API
- Scheduled cache warming (pre-fetch popular products)

### Cache Warming

Preload frequently accessed products on startup:
```bash
# Top 100 products cached on boot
npm run cache:warm
```

### Cache Metrics

Tracked via health endpoint:
- Hit rate (%)
- Miss rate (%)
- Eviction count
- Memory usage
- Connection status

---

## Monitoring

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2025-11-06T10:00:00.000Z",
  "service": "stock-integration-service",
  "components": {
    "redis": {
      "status": "up",
      "latency": 2,
      "connections": 5
    },
    "externalApi": {
      "status": "up",
      "lastCheck": "2025-11-06T09:59:45.000Z",
      "responseTime": 234
    },
    "circuitBreaker": {
      "state": "CLOSED",
      "failures": 0,
      "successRate": 99.2,
      "lastStateChange": "2025-11-06T08:00:00.000Z"
    }
  },
  "cache": {
    "hitRate": 85.3,
    "missRate": 14.7,
    "totalKeys": 1247
  }
}
```

### Logging

**Structured Logs**:
```json
{
  "timestamp": "2025-11-06T10:00:00.000Z",
  "level": "info",
  "service": "stock-integration",
  "context": "StockClientService",
  "message": "Product batch validated",
  "data": {
    "productIds": ["PROD-001", "PROD-002"],
    "cacheHit": true,
    "duration": 45
  }
}
```

**Log Levels**:
- `debug`: Cache hits/misses, retry attempts
- `info`: Successful operations, circuit state changes
- `warn`: Slow responses, approaching thresholds
- `error`: Failed requests, circuit opens, cache errors

### Metrics to Monitor

**Latency**:
- P50, P95, P99 response times
- Breakdown by endpoint

**Throughput**:
- Requests per second (RPS)
- Batch size distribution

**Errors**:
- Error rate (% of failed requests)
- Error types (network, timeout, 5xx)

**Circuit Breaker**:
- State duration (time in OPEN, HALF_OPEN)
- State transitions per hour
- Failure rate when CLOSED

**Cache**:
- Hit rate (target: >80%)
- Miss rate
- Eviction rate
- Memory usage (target: <2GB)

---

## Technologies

### Core Framework
- **NestJS 10**: Progressive Node.js framework
- **TypeScript 5.1**: Static typing

### HTTP Client
- **Axios 1.6.0**: Promise-based HTTP client
- **@nestjs/axios**: NestJS wrapper for Axios

### Caching
- **Redis 7**: In-memory data store
- **ioredis**: Redis client for Node.js
- **@nestjs/cache-manager**: Cache abstraction

### Validation & Documentation
- **class-validator**: DTO validation
- **Swagger/OpenAPI**: API documentation

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **redis-mock**: Redis mock for testing

---

## Architecture

### Service Architecture

```
┌─────────────────────────────────────────┐
│     Other Microservices                 │
│  (Shipping, Config, Operator Interface) │
└─────────────────┬───────────────────────┘
                  │ HTTP
┌─────────────────▼───────────────────────┐
│   Stock Integration Service             │
│   ┌─────────────────────────────────┐   │
│   │  Circuit Breaker                │   │
│   │  ┌─────────────────────────┐    │   │
│   │  │  Retry Policy           │    │   │
│   │  │  ┌─────────────────┐    │    │   │
│   │  │  │  Cache Layer    │    │    │   │
│   │  │  │  ┌───────────┐  │    │    │   │
│   │  │  │  │ HTTP Call │  │    │    │   │
│   │  │  │  └───────────┘  │    │    │   │
│   │  │  └─────────────────┘    │    │   │
│   │  └─────────────────────────┘    │   │
│   └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │  Redis   │    │  External  │
    │  Cache   │    │ Stock API  │
    └──────────┘    └────────────┘
```

### Design Patterns

1. **Proxy Pattern**: Acts as intermediary to external API
2. **Circuit Breaker Pattern**: Prevents cascading failures
3. **Retry Pattern**: Handles transient failures
4. **Cache-Aside Pattern**: Read-through caching
5. **Fallback Pattern**: Graceful degradation
6. **Adapter Pattern**: Adapts external API to internal interface

### Module Structure

```
src/
├── stock/
│   ├── stock.controller.ts        # Internal HTTP endpoints
│   ├── stock-client.service.ts    # External API client
│   ├── stock-client.service.spec.ts
│   ├── circuit-breaker.service.ts # Circuit breaker logic
│   ├── retry.service.ts           # Retry with backoff
│   ├── dto/
│   └── stock.module.ts
├── cache/
│   ├── cache.service.ts           # Redis operations
│   └── cache.service.spec.ts
├── health/
│   ├── health.controller.ts
│   └── health.service.ts
├── app.module.ts
└── main.ts
```

### Error Handling

```typescript
// Circuit breaker open
throw new ServiceUnavailableException({
  message: 'Stock service unavailable',
  circuitState: 'OPEN',
  retryAfter: 30,
});

// External API error
throw new BadGatewayException({
  message: 'Failed to fetch product data',
  externalError: error.message,
  productIds: failedIds,
});

// Cache error (non-blocking)
this.logger.warn('Cache operation failed', { error: error.message });
// Continue with external API call
```

---

## Development Workflow

### Adding New External Endpoint

1. **Define DTO**:
```typescript
export class CreateReservationDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
```

2. **Add Client Method**:
```typescript
async createReservation(dto: CreateReservationDto): Promise<Reservation> {
  const cacheKey = this.getCacheKey('reservation', dto.productId);

  return this.withCircuitBreaker(async () => {
    return this.withRetry(async () => {
      const response = await this.httpService.post(
        `${this.baseUrl}/reservations`,
        dto,
      ).toPromise();

      await this.cache.set(cacheKey, response.data, this.cacheTTL);
      return response.data;
    });
  });
}
```

3. **Add Controller Endpoint** (if needed for internal access):
```typescript
@Post('reservations')
async createReservation(@Body() dto: CreateReservationDto) {
  return this.stockClient.createReservation(dto);
}
```

4. **Write Tests**:
```typescript
describe('createReservation', () => {
  it('should create reservation and cache result', async () => {
    // test implementation
  });
});
```

### Code Style

- Wrap all external calls in circuit breaker + retry
- Cache successful responses when appropriate
- Log all state changes (circuit, cache, retries)
- Use descriptive error messages with context
- Add timeout to all HTTP requests

---

## Troubleshooting

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Check connection from Node.js
npm run redis:test

# Verify environment variables
echo $REDIS_HOST
echo $REDIS_PORT
```

### Circuit Breaker Stuck OPEN

```bash
# Check logs for failure patterns
tail -f logs/stock-integration.log | grep "CIRCUIT"

# Force circuit reset (development only)
curl -X POST http://localhost:3002/admin/circuit/reset

# Verify external API is accessible
curl -v http://external-stock-api.com/health
```

### High Cache Miss Rate

```bash
# Check Redis memory
redis-cli INFO memory

# Verify TTL configuration
echo $CACHE_TTL

# Warm cache
npm run cache:warm

# Monitor hit rate
curl http://localhost:3002/health | jq '.cache.hitRate'
```

### External API Timeouts

```bash
# Increase timeout
export STOCK_API_TIMEOUT=20000

# Check network latency
ping external-stock-api.com

# Test direct API call
curl -w "@curl-format.txt" http://external-stock-api.com/products/PROD-001
```

---

## Related Documentation

- **API Endpoints**: [ENDPOINTS.md](./ENDPOINTS.md)
- **Architecture**: [backend/docs/architecture/README.md](../../docs/architecture/README.md)
- **Redis Configuration**: [backend/docs/redis/README.md](../../docs/redis/README.md)
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
