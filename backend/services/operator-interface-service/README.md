# Operator Interface Service

API Gateway and facade for internal logistics operators. Provides unified access to all microservices with smart proxy routing, service discovery, request tracking, and aggregated health checks.

## Table of Contents

- [Overview](#overview)
- [Responsibilities](#responsibilities)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Routing Rules](#routing-rules)
- [Request Flow](#request-flow)
- [Service Registry](#service-registry)
- [Security](#security)
- [Technologies](#technologies)
- [Architecture](#architecture)

---

## Overview

**Operator Interface Service** is the API Gateway for the logistics platform. It serves as the single entry point for frontend applications and provides a unified interface to all backend microservices through intelligent proxy routing.

**Port**: `3004`
**Type**: API Gateway / Facade Pattern
**Dependencies**: Config Service, Shipping Service, Stock Integration Service

**Key Features**:
- 🌐 Smart proxy routing to backend services
- 📝 Service registry with dynamic discovery
- 🔍 Request ID tracking across services
- ❤️ Aggregated health checks
- 📦 Local cache for frequently accessed config endpoints
- 🔒 CORS configuration for frontend access
- 🛡️ Future: Authentication and authorization gateway

---

## Responsibilities

### 1. Smart Proxy Routing

Automatically routes incoming requests to appropriate backend services based on path patterns:

| Pattern | Target Service | Port | Example |
|---------|----------------|------|---------|
| `/config/*` | Config Service | 3003 | `/config/transport-methods` |
| `/shipping/*` | Shipping Service | 3001 | `/shipping/cost` |
| `/stock/*` | Stock Integration | 3002 | `/stock/availability/PROD-001` |
| `/fleet/*` | Config Service | 3003 | `/fleet/drivers` |
| `/gateway/status` | Gateway itself | 3004 | Service registry status |

### 2. Service Registry

Maintains a dynamic registry of available backend services:
- Service URLs and ports
- Health status (up, down, degraded, unknown)
- Response time metrics
- Last health check timestamp

### 3. Request ID Tracking

Generates and propagates `X-Request-ID` headers:
- Unique UUID v4 per request
- Forwarded to all backend services
- Included in all responses
- Enables distributed tracing and debugging

### 4. Aggregated Health Checks

Consolidates health status from all backend services:
- Overall gateway status
- Per-service health and response times
- Circuit breaker states
- Database and cache connectivity

### 5. Local Configuration Cache

Provides direct access to frequently used config endpoints:
- `GET /config/coverage-zones` - Local database query
- `POST /config/coverage-zones` - Local database write
- `GET /config/transport-methods` - Local database query
- `POST /config/transport-methods` - Local database write

**Benefits**:
- Reduces load on Config Service
- Faster response times for common queries
- Continued operation if Config Service is down

### 6. CORS Management

Centralized CORS configuration for frontend access:
- Development: `localhost:3000`, `localhost:3005`, `localhost:5173`
- Production: Configurable via `FRONTEND_URL` env variable
- Credentials support enabled
- All HTTP methods allowed

---

## Prerequisites

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 14.x (for local config endpoints)
- **Backend Services**: Config (3003), Shipping (3001), Stock (3002)
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

# 3. Navigate to service directory
cd backend/services/operator-interface-service
```

---

## Configuration

### Environment Variables

Create a `.env` file in the service root:

```bash
# Server Configuration
PORT=3004
NODE_ENV=development

# Database (for local config endpoints)
DATABASE_URL=postgresql://user:password@localhost:5432/logistics?schema=public

# Backend Service URLs
CONFIG_SERVICE_URL=http://localhost:3003
SHIPPING_SERVICE_URL=http://localhost:3001
STOCK_SERVICE_URL=http://localhost:3002

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:3005

# Timeouts (milliseconds)
PROXY_TIMEOUT=10000           # 10 seconds
SERVICE_HEALTH_CHECK_INTERVAL=30000  # 30 seconds

# Logging
LOG_LEVEL=debug
```

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3004` |
| `DATABASE_URL` | PostgreSQL for local endpoints | - |
| `CONFIG_SERVICE_URL` | Config Service base URL | `http://localhost:3003` |
| `SHIPPING_SERVICE_URL` | Shipping Service base URL | `http://localhost:3001` |
| `STOCK_SERVICE_URL` | Stock Service base URL | `http://localhost:3002` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |

---

## Running the Service

### Development Mode

```bash
# From service directory
npm run start:dev

# The service will be available at:
# - API Gateway: http://localhost:3004
# - Swagger: http://localhost:3004/api/docs
# - Gateway Status: http://localhost:3004/gateway/status
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
docker build -t operator-interface-service:latest .

# Run container
docker run -p 3004:3004 --env-file .env operator-interface-service:latest
```

### Service Startup Order

**Important**: Backend services should start before the gateway:

```bash
# 1. Start dependencies (PostgreSQL, Redis)
docker-compose up -d postgres redis

# 2. Start backend services
cd backend/services/config-service && npm run start:dev &
cd backend/services/shipping-service && npm run start:dev &
cd backend/services/stock-integration-service && npm run start:dev &

# 3. Start gateway (operator-interface)
cd backend/services/operator-interface-service && npm run start:dev
```

---

## API Documentation

### Interactive Documentation

**Swagger UI**: [http://localhost:3004/api/docs](http://localhost:3004/api/docs)

### Detailed API Reference

See [ENDPOINTS.md](./ENDPOINTS.md) for comprehensive documentation including:
- Proxy routing rules
- Request/response headers
- Error handling (502, 504)
- Service registry format
- Local config endpoint examples

### Endpoint Overview

#### Gateway Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Gateway info and available routes |
| `GET` | `/gateway/status` | Service registry and metrics |
| `GET` | `/health` | Aggregated health check |

#### Proxied Endpoints

All requests to backend services are automatically proxied:

```bash
# These are proxied to backend services
GET    /config/*         → Config Service
POST   /config/*         → Config Service
GET    /shipping/*       → Shipping Service
POST   /shipping/*       → Shipping Service
GET    /stock/*          → Stock Integration
POST   /stock/*          → Stock Integration
GET    /fleet/*          → Config Service
```

#### Local Config Endpoints

Direct database access (not proxied):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/config/coverage-zones` | List coverage zones |
| `POST` | `/config/coverage-zones` | Create coverage zone |
| `GET` | `/config/coverage-zones/:id` | Get specific zone |
| `PATCH` | `/config/coverage-zones/:id` | Update zone |
| `DELETE` | `/config/coverage-zones/:id` | Soft delete zone |
| `GET` | `/config/transport-methods` | List transport methods |
| `POST` | `/config/transport-methods` | Create transport method |
| `GET` | `/config/transport-methods/:id` | Get specific method |
| `PATCH` | `/config/transport-methods/:id` | Update method |
| `DELETE` | `/config/transport-methods/:id` | Soft delete method |

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

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e config.coverage-zones.e2e.spec.ts
```

E2E tests are located in: `test/e2e/*.e2e-spec.ts`

**Available E2E test suites:**
- `config.coverage-zones.e2e.spec.ts` - Local coverage zones CRUD
- `config.transport-methods.e2e.spec.ts` - Local transport methods CRUD
- `config.tariff-configs.e2e.spec.ts` - Proxied tariff configs (via Config Service)
- `shipping.health.e2e.spec.ts` - Proxied shipping health check
- `shipping.quotes.e2e.spec.ts` - Proxied shipping cost calculation
- `stock.health.e2e.spec.ts` - Proxied stock health check
- `gateway.unknown.e2e.spec.ts` - Unknown route handling (404)

### Test Configuration

E2E tests use: `test/jest-e2e.json`
- **Timeout**: 30 seconds per test
- **Requires**: All backend services running

---

## Routing Rules

### Pattern Matching

The gateway uses prefix-based routing:

1. **Exact Match**: Check if path matches gateway's own endpoints
2. **Prefix Match**: Check if path starts with known service prefix
3. **Forward**: Proxy to matched backend service
4. **404**: Return Not Found if no match

### Request Transformation

**Headers Added**:
```
X-Request-ID: uuid-v4-generated
X-Forwarded-For: client-ip-address
X-Forwarded-Proto: http | https
X-Gateway-Version: 1.0.0
```

**Headers Preserved**:
- `Authorization`
- `Content-Type`
- `Accept`
- All custom headers from client

**Headers Removed**:
- `Host` (replaced with backend service host)
- Internal gateway headers

### Response Transformation

**Headers Added**:
```
X-Request-ID: same-uuid-from-request
X-Response-Time: duration-in-ms
X-Service-Name: config-service | shipping-service | stock-integration-service
```

**Status Codes**:
- `200-299`: Success from backend service (pass through)
- `502`: Backend service unavailable
- `504`: Backend service timeout (10s)
- `404`: Unknown route (no matching service)

---

## Request Flow

### Example: Calculate Shipping Cost

```
1. Frontend Request:
   POST http://localhost:3004/shipping/cost
   Headers:
     Content-Type: application/json
     Authorization: Bearer <token>
   Body: { origin: {...}, destination: {...}, products: [...] }

2. Gateway Processing:
   - Generate X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
   - Match route pattern: /shipping/* → SHIPPING_SERVICE_URL
   - Add tracking headers
   - Set timeout: 10 seconds

3. Proxy to Backend:
   POST http://localhost:3001/shipping/cost
   Headers:
     Content-Type: application/json
     Authorization: Bearer <token>
     X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
     X-Forwarded-For: 192.168.1.100
     X-Forwarded-Proto: http
     X-Gateway-Version: 1.0.0

4. Backend Response:
   201 Created
   { quoteId: "QUOTE-001", totalCost: 1250.50, ... }

5. Gateway Response:
   201 Created
   Headers:
     X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
     X-Response-Time: 234ms
     X-Service-Name: shipping-service
   Body: { quoteId: "QUOTE-001", totalCost: 1250.50, ... }
```

### Error Flow: Service Down

```
1. Frontend Request:
   GET http://localhost:3004/config/transport-methods

2. Gateway Processing:
   - Generate X-Request-ID
   - Match route: /config/* → CONFIG_SERVICE_URL
   - Attempt proxy to http://localhost:3003/config/transport-methods

3. Backend Connection Failed:
   Error: ECONNREFUSED (Config Service not running)

4. Gateway Response:
   502 Bad Gateway
   Headers:
     X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
   Body:
   {
     "statusCode": 502,
     "message": "Service 'config-service' is not available",
     "error": "Bad Gateway",
     "service": "config-service",
     "requestId": "123e4567-e89b-12d3-a456-426614174000"
   }
```

---

## Service Registry

### Registry Format

```json
{
  "gateway": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400
  },
  "services": {
    "config-service": {
      "url": "http://localhost:3003",
      "status": "up",
      "lastCheck": "2025-11-06T10:00:00.000Z",
      "responseTime": 45
    },
    "shipping-service": {
      "url": "http://localhost:3001",
      "status": "up",
      "lastCheck": "2025-11-06T10:00:00.000Z",
      "responseTime": 120
    },
    "stock-integration-service": {
      "url": "http://localhost:3002",
      "status": "degraded",
      "lastCheck": "2025-11-06T10:00:00.000Z",
      "responseTime": 8500,
      "warning": "High response time"
    }
  },
  "totalRequests": 15234,
  "errorRate": 0.02
}
```

### Service Status Values

| Status | Description | Action |
|--------|-------------|--------|
| `up` | Service responding normally | Route traffic |
| `down` | Service not responding | Return 502 |
| `degraded` | Service slow or intermittent | Route with warning |
| `unknown` | Status not yet checked | Attempt routing |

### Health Check Strategy

**Periodic Checks**:
- **Interval**: Every 30 seconds
- **Timeout**: 5 seconds
- **Retry**: 2 attempts before marking as down

**Endpoints Checked**:
- `GET /health` on each backend service

**Status Determination**:
```typescript
if (response.status === 200 && responseTime < 1000) {
  status = 'up';
} else if (response.status === 200 && responseTime >= 1000) {
  status = 'degraded';
} else {
  status = 'down';
}
```

---

## Security

### Current State (Development)

- ✅ CORS configured for specific frontend origins
- ✅ Request ID tracking for audit trails
- ✅ Input validation via DTOs
- ✅ Automatic sanitization
- ❌ No authentication (endpoints open)
- ❌ No authorization (no role checks)
- ❌ No rate limiting

### Production Roadmap

#### 1. Authentication (Keycloak + JWT)

**Implementation Guide**: See [JWT-IMPLEMENTATION-GUIDE.md](./JWT-IMPLEMENTATION-GUIDE.md)

```typescript
// Validate JWT at gateway level
@UseGuards(KeycloakGuard)
@Controller()
export class GatewayController {
  // Protected routes
}
```

**Flow**:
1. Frontend authenticates with Keycloak
2. Receives JWT token
3. Sends token in `Authorization: Bearer <token>` header
4. Gateway validates token with Keycloak
5. Extracts user info (roles, email)
6. Forwards token to backend services

#### 2. Authorization (Role-Based Access Control)

```typescript
@Roles('operator', 'admin')
@Post('/config/transport-methods')
async createTransportMethod() {
  // Only operators and admins can create
}
```

#### 3. Rate Limiting

**Recommended Limits**:
- **Per IP**: 100 requests/minute
- **Per User**: 1000 requests/hour
- **Per Endpoint**: Custom limits (e.g., /shipping/cost: 20/min)

**Implementation**:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(100, 60) // 100 requests per 60 seconds
```

#### 4. Additional Security Measures

- **API Keys**: For service-to-service auth
- **HTTPS Only**: Force TLS in production
- **Security Headers**: Helmet.js middleware
- **Input Sanitization**: XSS prevention
- **SQL Injection Prevention**: Prisma parameterized queries
- **CSRF Protection**: For stateful operations

**Configuration Guide**: See [KEYCLOAK-CONFIG.md](./KEYCLOAK-CONFIG.md)

---

## Technologies

### Core Framework
- **NestJS 10**: Progressive Node.js framework
- **TypeScript 5.1**: Static typing

### Gateway Functionality
- **http-proxy-middleware**: Proxy routing
- **@nestjs/axios**: HTTP client for health checks
- **uuid**: Request ID generation

### Database (Local Endpoints)
- **Prisma ORM**: For coverage-zones and transport-methods

### Validation & Documentation
- **class-validator**: DTO validation
- **class-transformer**: Object transformation
- **Swagger/OpenAPI**: API documentation

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library

---

## Architecture

### Gateway Pattern

```
┌─────────────────────────────────────┐
│          Frontend                   │
│    (Next.js on port 3005)           │
└──────────────┬──────────────────────┘
               │ Single Entry Point
┌──────────────▼──────────────────────┐
│   Operator Interface (Gateway)      │
│         Port 3004                    │
│                                      │
│  ┌────────────────────────────┐     │
│  │  Request ID Generator      │     │
│  └────────────┬───────────────┘     │
│               │                      │
│  ┌────────────▼───────────────┐     │
│  │  Service Registry          │     │
│  └────────────┬───────────────┘     │
│               │                      │
│  ┌────────────▼───────────────┐     │
│  │  Smart Router              │     │
│  │  (Pattern Matcher)         │     │
│  └─┬──────┬──────┬────────────┘     │
└────┼──────┼──────┼──────────────────┘
     │      │      │
     │      │      │ Proxy Routes
┌────▼──┐ ┌─▼────┐ ┌▼──────────┐
│Config │ │Ship- │ │Stock      │
│ 3003  │ │ping  │ │Integration│
│       │ │ 3001 │ │ 3002      │
└───────┘ └──────┘ └───────────┘
```

### Design Patterns

1. **API Gateway Pattern**: Single entry point for all services
2. **Facade Pattern**: Simplifies access to complex subsystems
3. **Proxy Pattern**: Forwards requests to appropriate backend
4. **Service Registry Pattern**: Maintains service directory
5. **Circuit Breaker Pattern**: Fails fast for down services (future)
6. **Request ID Pattern**: Distributed tracing support

### Module Structure

```
src/
├── gateway/
│   ├── gateway.controller.ts      # /gateway/status
│   ├── gateway.service.ts         # Service registry logic
│   └── gateway.module.ts
├── proxy/
│   ├── proxy.middleware.ts        # Smart routing middleware
│   └── proxy.service.ts           # HTTP proxy logic
├── config/
│   ├── coverage-zones/            # Local endpoints
│   ├── transport-methods/         # Local endpoints
│   └── config.module.ts
├── health/
│   ├── health.controller.ts       # Aggregated health
│   └── health.service.ts
├── app.controller.ts              # Root endpoint
├── app.module.ts
└── main.ts
```

### Communication Patterns

- **Inbound**: HTTP REST from frontend
- **Outbound**: HTTP REST to backend services
- **Database**: PostgreSQL via Prisma (for local config only)

### Error Handling

```typescript
// Service unavailable
throw new BadGatewayException({
  statusCode: 502,
  message: `Service '${serviceName}' is not available`,
  error: 'Bad Gateway',
  service: serviceName,
  requestId: requestId,
});

// Service timeout
throw new GatewayTimeoutException({
  statusCode: 504,
  message: `Request timeout to '${serviceName}'`,
  error: 'Gateway Timeout',
  timeout: timeoutMs,
});
```

---

## Development Workflow

### Adding a New Backend Service

1. **Register in Service Registry**:
```typescript
// gateway/gateway.service.ts
private services = {
  'config-service': process.env.CONFIG_SERVICE_URL,
  'shipping-service': process.env.SHIPPING_SERVICE_URL,
  'new-service': process.env.NEW_SERVICE_URL, // Add here
};
```

2. **Add Routing Rule**:
```typescript
// proxy/proxy.middleware.ts
private routingTable = {
  '/config': 'config-service',
  '/shipping': 'shipping-service',
  '/new-path': 'new-service', // Add here
};
```

3. **Update Environment**:
```bash
# .env
NEW_SERVICE_URL=http://localhost:3005
```

4. **Test Proxy**:
```bash
curl http://localhost:3004/new-path/endpoint
# Should proxy to http://localhost:3005/new-path/endpoint
```

### Code Style

- Keep gateway logic minimal (thin proxy)
- Delegate business logic to backend services
- Log all routing decisions
- Add timeout to all proxy requests
- Return meaningful error messages

---

## Troubleshooting

### 502 Bad Gateway for All Services

**Cause**: Backend services not running

**Solution**:
```bash
# Check each service
curl http://localhost:3003/health  # Config
curl http://localhost:3001/health  # Shipping
curl http://localhost:3002/health  # Stock

# Start missing services
cd backend/services/<service-name>
npm run start:dev
```

### CORS Errors from Frontend

**Cause**: `FRONTEND_URL` mismatch

**Solution**:
```bash
# Check current setting
echo $FRONTEND_URL

# Update in .env
FRONTEND_URL=http://localhost:5173

# Restart gateway
npm run start:dev
```

### Request ID Not Propagating

**Cause**: Backend services not reading header

**Solution**: Ensure backend services log `X-Request-ID` from headers

### High Response Times

**Cause**: Backend service slow

**Solution**:
```bash
# Check service registry for slow services
curl http://localhost:3004/gateway/status

# Identify slow service and investigate
curl -w "@curl-format.txt" http://localhost:3001/endpoint
```

---

## Related Documentation

- **API Endpoints**: [ENDPOINTS.md](./ENDPOINTS.md)
- **JWT Implementation**: [JWT-IMPLEMENTATION-GUIDE.md](./JWT-IMPLEMENTATION-GUIDE.md)
- **Keycloak Setup**: [KEYCLOAK-CONFIG.md](./KEYCLOAK-CONFIG.md)
- **E2E Tests Guide**: [TESTS.md](./TESTS.md)
- **Architecture**: [backend/docs/architecture/README.md](../../docs/architecture/README.md)
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
