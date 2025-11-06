# Stock Integration Service - API Endpoints

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Health Check](#health-check)
- [Servicios Internos](#servicios-internos)
- [Circuit Breaker](#circuit-breaker)
- [Cache](#cache)

---

## Información General

**Base URL**: `http://localhost:3002`
**API Gateway**: `http://localhost:3004/stock`
**Swagger UI**: `http://localhost:3002/api/docs`

### Descripción
Servicio HTTP interno para integración con el módulo de Stock. Proporciona cliente resiliente con circuit breaker, retry automático y cache Redis. Gestiona consultas de disponibilidad, reservas y sincronización de inventario.

**⚠️ IMPORTANTE**: Este servicio NO expone endpoints públicos de negocio. Es consumido internamente por otros microservicios (principalmente Shipping Service).

### Arquitectura

```
Shipping Service → Stock Integration Service → External Stock API
                   (Circuit Breaker + Cache)
```

### Características

- **Circuit Breaker**: Previene cascading failures
- **Retry con Exponential Backoff**: Hasta 3 intentos automáticos
- **Cache Redis**: TTL de 5 minutos
- **Logging Estructurado**: Todos los requests/responses loggeados
- **Health Monitoring**: Monitoreo del estado del circuit breaker

---

## Health Check

### GET `/health`

Verifica el estado del servicio, circuit breaker y conexiones externas.

#### Response (200)

```json
{
  "status": "ok",
  "timestamp": "2024-11-06T10:00:00.000Z",
  "service": "stock-integration-service",
  "circuitBreaker": {
    "state": "CLOSED",
    "failureCount": 0,
    "threshold": 5,
    "timeout": 30000
  },
  "cache": {
    "status": "connected",
    "host": "localhost:6379"
  },
  "externalApi": {
    "stockModule": {
      "status": "reachable",
      "baseUrl": "http://stock-api.example.com",
      "lastCheck": "2024-11-06T09:59:50.000Z"
    }
  },
  "uptime": 86400
}
```

#### Circuit Breaker States

| Estado | Descripción |
|--------|-------------|
| `CLOSED` | Normal - Requests se envían al API externa |
| `OPEN` | Fallando - Requests son rechazados inmediatamente |
| `HALF_OPEN` | Recuperación - Permite un request de prueba |

#### Response (503) - Service Degraded

```json
{
  "status": "degraded",
  "timestamp": "2024-11-06T10:00:00.000Z",
  "service": "stock-integration-service",
  "circuitBreaker": {
    "state": "OPEN",
    "failureCount": 5,
    "nextAttempt": "2024-11-06T10:00:30.000Z"
  },
  "cache": {
    "status": "connected"
  },
  "externalApi": {
    "stockModule": {
      "status": "unreachable",
      "error": "Connection timeout after 5000ms"
    }
  }
}
```

---

### GET `/`

Endpoint raíz con información del servicio.

#### Response (200)

```json
{
  "service": "stock-integration-service",
  "version": "1.0.0",
  "description": "HTTP client service for Stock module integration",
  "capabilities": [
    "Product availability queries",
    "Stock reservations",
    "Inventory synchronization",
    "Circuit breaker protection",
    "Automatic retry with exponential backoff",
    "Redis caching"
  ],
  "externalApi": {
    "baseUrl": "http://stock-api.example.com",
    "timeout": 5000,
    "retryAttempts": 3
  }
}
```

---

## Servicios Internos

### StockIntegrationService

**Nota**: Estos métodos NO son endpoints HTTP directos. Son servicios internos consumidos por otros microservicios vía inyección de dependencias.

#### `getProductAvailability(productId: string)`

Consulta disponibilidad de un producto en el inventario.

**Parámetros:**
- `productId`: ID del producto a consultar

**Retorna:**
```typescript
{
  productId: string;
  available: boolean;
  quantity: number;
  warehouse: string;
  lastUpdated: Date;
}
```

**Características:**
- ✅ Cache: 5 minutos
- ✅ Circuit breaker habilitado
- ✅ Retry: 3 intentos con exponential backoff (2s, 4s, 8s)

---

#### `reserveStock(reservationDto: ReservaStockDto)`

Reserva stock para un pedido.

**DTO:**
```typescript
{
  productId: string;
  quantity: number;
  orderId: string;
  expiresAt?: Date;
}
```

**Retorna:**
```typescript
{
  reservationId: string;
  productId: string;
  quantity: number;
  status: 'RESERVED' | 'FAILED';
  expiresAt: Date;
}
```

**Características:**
- ❌ NO cacheado (operación crítica)
- ✅ Circuit breaker habilitado
- ✅ Retry: 2 intentos (más corto para no duplicar reservas)

---

#### `releaseStock(reservationId: string)`

Libera una reserva de stock (por cancelación o timeout).

**Parámetros:**
- `reservationId`: ID de la reserva a liberar

**Retorna:**
```typescript
{
  reservationId: string;
  status: 'RELEASED' | 'ALREADY_CONSUMED' | 'NOT_FOUND';
}
```

---

#### `syncInventory(productIds: string[])`

Sincroniza inventario de múltiples productos.

**Parámetros:**
- `productIds`: Array de IDs de productos a sincronizar

**Retorna:**
```typescript
{
  synced: number;
  failed: number;
  products: Array<{
    productId: string;
    quantity: number;
    status: 'SYNCED' | 'FAILED';
  }>;
}
```

---

## Circuit Breaker

### Configuración

```typescript
{
  threshold: 5,           // Fallos consecutivos antes de abrir
  timeout: 30000,         // Tiempo en OPEN antes de intentar HALF_OPEN (30s)
  rollingWindow: 60000,   // Ventana de tiempo para contar fallos (60s)
}
```

### Estados y Transiciones

```
CLOSED → (5 fallos) → OPEN → (30s) → HALF_OPEN
                                    ↓
                         (1 éxito) ← CLOSED
                         (fallo) → OPEN
```

### Monitoreo

El estado del circuit breaker está disponible en el endpoint `/health`.

**Métricas expuestas:**
- Estado actual (CLOSED/OPEN/HALF_OPEN)
- Contador de fallos
- Timestamp del último cambio de estado
- Próximo intento (cuando está OPEN)

---

## Cache

### Configuración Redis

```typescript
{
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  ttl: 300,  // 5 minutos
}
```

### Estrategia de Cache

#### Qué se cachea:
- ✅ Consultas de disponibilidad de productos
- ✅ Información de inventario
- ✅ Datos de productos

#### Qué NO se cachea:
- ❌ Reservas de stock
- ❌ Liberaciones de reservas
- ❌ Operaciones de escritura

### Cache Keys

```
stock:product:{productId}           # Disponibilidad de producto
stock:inventory:{warehouseId}        # Inventario de almacén
stock:sync:{productIds}              # Sincronización de múltiples productos
```

### Invalidación

El cache se invalida:
- ✅ Automáticamente por TTL (5 minutos)
- ✅ Manualmente en operaciones de escritura
- ✅ Por eventos de sincronización externa

---

## Retry Policy

### Configuración

```typescript
{
  maxAttempts: 3,
  initialDelay: 2000,     // 2 segundos
  maxDelay: 8000,         // 8 segundos
  backoffMultiplier: 2,   // Exponencial
}
```

### Estrategia

```
Intento 1: Inmediato
Intento 2: +2 segundos (2s)
Intento 3: +4 segundos (4s acumulado = 6s total)
Intento 4: +8 segundos (8s acumulado = 14s total)
```

### Qué se retintenta:
- ✅ Timeout errors
- ✅ 5xx Server errors
- ✅ Network errors

### Qué NO se retintenta:
- ❌ 4xx Client errors
- ❌ Validation errors
- ❌ Authentication errors

---

## Logging

### Estructura de Logs

Todos los requests/responses se loguean con el siguiente formato:

```json
{
  "timestamp": "2024-11-06T10:00:00.000Z",
  "level": "info",
  "service": "stock-integration-service",
  "operation": "getProductAvailability",
  "productId": "PROD-001",
  "duration": 245,
  "cacheHit": false,
  "circuitBreakerState": "CLOSED",
  "retryAttempt": 0,
  "success": true
}
```

### Niveles de Log

| Nivel | Cuándo |
|-------|--------|
| `debug` | Request/Response detallados |
| `info` | Operaciones exitosas |
| `warn` | Retry attempts, cache miss |
| `error` | Fallos, circuit breaker OPEN |

---

## Configuración de Ambiente

### Variables de Entorno

```bash
# Node
NODE_ENV=development

# Service
PORT=3002

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# External Stock API
STOCK_API_BASE_URL=http://stock-api.example.com
STOCK_API_TIMEOUT=5000
STOCK_API_RETRY_ATTEMPTS=3

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=30000

# Keycloak (si se usa autenticación)
KEYCLOAK_URL=http://keycloak.example.com
KEYCLOAK_REALM=logistics
KEYCLOAK_CLIENT_ID=stock-integration
KEYCLOAK_CLIENT_SECRET=secret
```

### Ejemplo `.env`

```bash
NODE_ENV=production
PORT=3002
REDIS_HOST=redis-server
REDIS_PORT=6379
STOCK_API_BASE_URL=https://api.stock.production.com
CIRCUIT_BREAKER_THRESHOLD=5
```

---

## Testing

### Tests Disponibles

```bash
# Unit tests
npm run test

# Específicos del servicio
npm run test stock-integration.service.spec.ts
npm run test stock-circuit-breaker.service.spec.ts
npm run test stock-cache.service.spec.ts

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Archivos de Test

- `/src/__tests__/stock-integration.service.spec.ts` - Tests del servicio principal
- `/src/__tests__/stock-circuit-breaker.service.spec.ts` - Tests del circuit breaker
- `/src/__tests__/stock-cache.service.spec.ts` - Tests del cache
- `/src/__tests__/integration/stock-api.integration.spec.ts` - Tests de integración
- `/test/e2e/health.e2e-spec.ts` - Tests E2E del health check

---

## Monitoreo y Alertas

### Métricas Recomendadas

- **Circuit Breaker State**: Alertar si está en OPEN por > 5 minutos
- **Cache Hit Rate**: Alertar si < 60%
- **Retry Rate**: Alertar si > 20% de requests requieren retry
- **Response Time**: Alertar si p95 > 2 segundos
- **Error Rate**: Alertar si > 5%

### Health Check Endpoints para Monitoreo

```bash
# Verificar estado general
curl http://localhost:3002/health

# Verificar desde API Gateway
curl http://localhost:3004/stock/health
```

---

## Troubleshooting

### Circuit Breaker en OPEN

**Síntomas**: Requests fallan inmediatamente con error 503

**Causas comunes:**
1. Stock API externa no responde
2. Timeout muy bajo configurado
3. Threshold de fallos muy bajo

**Solución:**
1. Verificar conectividad con Stock API: `curl http://stock-api.example.com/health`
2. Revisar logs: `docker logs stock-integration-service`
3. Esperar timeout (30s) para que circuit breaker pase a HALF_OPEN
4. Si persiste, reiniciar servicio: `npm run start`

### Cache No Funciona

**Síntomas**: Todas las requests golpean el API externa

**Verificar:**
1. Redis está corriendo: `redis-cli ping`
2. Conexión correcta: revisar `REDIS_HOST` en `.env`
3. TTL configurado: verificar en `/health` que cache.status = "connected"

### Retry Loops Infinitos

**No debería ocurrir** - El sistema está configurado con un máximo de 3 intentos.

Si ocurre, verificar:
1. Configuración de `maxAttempts`
2. Logs para identificar qué está causando los reintentos
3. Posible bug en la lógica de retry

---

## Documentación Adicional

- **README**: `/backend/services/stock-integration-service/src/README.md`
- **Troubleshooting**: `/backend/services/stock-integration-service/src/TROUBLESHOOTING.md`
- **Swagger**: http://localhost:3002/api/docs

---

**Última actualización**: 2024-11-06
**Versión del servicio**: 1.0.0
**Mantenido por**: Grupo 12 - UTN FRRE
