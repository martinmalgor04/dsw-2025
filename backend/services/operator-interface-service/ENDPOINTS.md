# Operator Interface Service (API Gateway) - Endpoints

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Gateway Status](#gateway-status)
- [Proxy Routing](#proxy-routing)
- [Config Endpoints (Local)](#config-endpoints-local)
- [Health Check](#health-check)

---

## Información General

**Base URL**: `http://localhost:3004`
**Swagger UI**: `http://localhost:3004/api/docs`

### Descripción
API Gateway y Facade para operadores internos de logística. Proporciona acceso unificado a todos los microservicios del sistema mediante smart proxy routing. Incluye copias locales de endpoints de configuración y enrutamiento automático a servicios backend.

### Arquitectura

```
Frontend (Next.js)
       ↓
Operator Interface (Gateway) - Port 3004
       ↓
    ┌──┴──┬──────┬───────┐
    ↓     ↓      ↓       ↓
  Config Shipping Stock  Database
  (3003) (3001)  (3002)
```

### Características

- **Smart Proxy Routing**: Enruta automáticamente requests a servicios backend
- **Service Registry**: Registro dinámico de servicios disponibles
- **Request ID Tracking**: Header `X-Request-ID` en todos los requests
- **Health Aggregation**: Consolida health checks de todos los servicios
- **Local Cache**: Endpoints locales para configuración frecuentemente accedida
- **CORS**: Configurado para frontend en desarrollo y producción

---

## Gateway Status

### GET `/gateway/status`

Obtiene el estado del gateway y el registro de servicios.

#### Response (200)

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
      "lastCheck": "2024-11-06T10:00:00.000Z",
      "responseTime": 45
    },
    "shipping-service": {
      "url": "http://localhost:3001",
      "status": "up",
      "lastCheck": "2024-11-06T10:00:00.000Z",
      "responseTime": 120
    },
    "stock-integration-service": {
      "url": "http://localhost:3002",
      "status": "up",
      "lastCheck": "2024-11-06T10:00:00.000Z",
      "responseTime": 35
    }
  },
  "totalRequests": 15234,
  "errorRate": 0.02
}
```

#### Service Status Values

| Status | Descripción |
|--------|-------------|
| `up` | Servicio funcionando correctamente |
| `down` | Servicio no responde |
| `degraded` | Servicio responde pero con problemas |
| `unknown` | Estado desconocido |

---

## Proxy Routing

### Universal Proxy: `/*`

El gateway enruta automáticamente todas las rutas no manejadas localmente a los servicios backend correspondientes.

#### Reglas de Enrutamiento

| Pattern | Target Service | Example |
|---------|----------------|---------|
| `/config/*` | Config Service (3003) | `/config/transport-methods` → `http://localhost:3003/config/transport-methods` |
| `/shipping/*` | Shipping Service (3001) | `/shipping/cost` → `http://localhost:3001/shipping/cost` |
| `/stock/*` | Stock Integration (3002) | `/stock/availability` → `http://localhost:3002/stock/availability` |
| `/fleet/*` | Config Service (3003) | `/fleet/drivers` → `http://localhost:3003/fleet/drivers` |

#### Request Headers

El gateway agrega los siguientes headers a todos los proxied requests:

```
X-Request-ID: uuid-v4-generated
X-Forwarded-For: client-ip
X-Forwarded-Proto: http/https
X-Gateway-Version: 1.0.0
```

#### Response Headers

Todos los responses del gateway incluyen:

```
X-Request-ID: uuid-v4-generated
X-Response-Time: 123ms
X-Service-Name: config-service | shipping-service | stock-integration-service
```

#### Ejemplos

```bash
# Proxied al Config Service
curl http://localhost:3004/config/transport-methods

# Proxied al Shipping Service
curl -X POST http://localhost:3004/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{...}'

# Proxied al Stock Integration
curl http://localhost:3004/stock/health
```

#### Error Handling

**502 - Bad Gateway:**
Cuando el servicio backend no está disponible:

```json
{
  "statusCode": 502,
  "message": "Service 'config-service' is not available",
  "error": "Bad Gateway",
  "service": "config-service",
  "requestId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**504 - Gateway Timeout:**
Cuando el servicio backend no responde en tiempo (timeout: 10s):

```json
{
  "statusCode": 504,
  "message": "Request timeout to 'shipping-service'",
  "error": "Gateway Timeout",
  "timeout": 10000
}
```

---

## Config Endpoints (Local)

### Coverage Zones

#### GET `/config/coverage-zones`

Lista todas las zonas de cobertura (endpoint local, accede directamente a BD).

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Zona Centro",
    "postalCodes": ["1000", "1001"],
    "isActive": true
  }
]
```

---

#### POST `/config/coverage-zones`

Crea una nueva zona de cobertura (endpoint local).

**Request Body:**
```json
{
  "name": "Zona Norte",
  "description": "Zona de cobertura norte",
  "postalCodes": ["1600", "1601"],
  "isActive": true
}
```

**Response (201):** Zona creada

**Errores:**
- `400`: Datos inválidos
- `409`: Zona duplicada

---

#### GET `/config/coverage-zones/:id`

Obtiene una zona específica por ID (endpoint local).

---

#### PATCH `/config/coverage-zones/:id`

Actualiza una zona (endpoint local).

---

### Transport Methods

#### GET `/config/transport-methods`

Lista todos los métodos de transporte (endpoint local).

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "ground",
    "name": "Terrestre",
    "averageSpeed": 80,
    "baseCostPerKm": "1.20",
    "baseCostPerKg": "2.50",
    "isActive": true
  }
]
```

---

#### POST `/config/transport-methods`

Crea un nuevo método de transporte (endpoint local).

**Request Body:**
```json
{
  "code": "express",
  "name": "Express",
  "description": "Entrega express en 24hs",
  "averageSpeed": 100,
  "estimatedDays": "1",
  "baseCostPerKm": 2.5,
  "baseCostPerKg": 5.0,
  "isActive": true
}
```

**Response (201):** Método creado

---

#### GET `/config/transport-methods/:id`

Obtiene un método de transporte por ID (endpoint local).

---

#### PATCH `/config/transport-methods/:id`

Actualiza un método de transporte (endpoint local).

---

## Health Check

### GET `/health`

Verifica el estado del gateway y sus servicios backend.

#### Response (200) - Healthy

```json
{
  "status": "ok",
  "timestamp": "2024-11-06T10:00:00.000Z",
  "service": "operator-interface-service",
  "gateway": {
    "version": "1.0.0",
    "uptime": 86400
  },
  "backends": {
    "config-service": {
      "status": "up",
      "responseTime": 45,
      "lastCheck": "2024-11-06T10:00:00.000Z"
    },
    "shipping-service": {
      "status": "up",
      "responseTime": 120,
      "lastCheck": "2024-11-06T10:00:00.000Z"
    },
    "stock-integration-service": {
      "status": "up",
      "responseTime": 35,
      "lastCheck": "2024-11-06T10:00:00.000Z"
    }
  }
}
```

#### Response (503) - Degraded

Cuando uno o más servicios backend están caídos:

```json
{
  "status": "degraded",
  "timestamp": "2024-11-06T10:00:00.000Z",
  "service": "operator-interface-service",
  "backends": {
    "config-service": {
      "status": "up"
    },
    "shipping-service": {
      "status": "down",
      "error": "Connection refused",
      "lastCheck": "2024-11-06T10:00:00.000Z"
    },
    "stock-integration-service": {
      "status": "up"
    }
  }
}
```

---

### GET `/`

Endpoint raíz con información del gateway.

**Response (200):**
```json
{
  "service": "operator-interface-service",
  "type": "api-gateway",
  "version": "1.0.0",
  "description": "API Gateway for internal logistics operators",
  "routes": {
    "config": "http://localhost:3003",
    "shipping": "http://localhost:3001",
    "stock": "http://localhost:3002"
  },
  "features": [
    "Smart proxy routing",
    "Service discovery",
    "Request ID tracking",
    "Health aggregation",
    "CORS enabled"
  ]
}
```

---

## Request Flow

### Ejemplo de Request Completo

```bash
# Request del cliente
curl -X POST http://localhost:3004/shipping/cost \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "origin": {...},
    "destination": {...},
    "products": [...]
  }'

# Gateway procesa:
# 1. Genera X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
# 2. Identifica target: shipping-service (3001)
# 3. Agrega headers: X-Request-ID, X-Forwarded-For
# 4. Proxea al backend: http://localhost:3001/shipping/cost
# 5. Recibe respuesta del backend
# 6. Agrega headers de respuesta: X-Request-ID, X-Response-Time
# 7. Devuelve al cliente

# Response al cliente
HTTP/1.1 201 Created
X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
X-Response-Time: 234ms
X-Service-Name: shipping-service
Content-Type: application/json

{
  "quoteId": "...",
  "totalCost": 1250.50,
  ...
}
```

---

## Service Registry

### Configuración de Servicios

Los servicios se registran automáticamente al iniciar el gateway mediante variables de entorno:

```bash
# .env
CONFIG_SERVICE_URL=http://localhost:3003
SHIPPING_SERVICE_URL=http://localhost:3001
STOCK_SERVICE_URL=http://localhost:3002
```

### Health Check de Servicios

El gateway realiza health checks periódicos a todos los servicios registrados:

- **Intervalo**: Cada 30 segundos
- **Timeout**: 5 segundos
- **Retry**: 2 intentos antes de marcar como `down`

### Service Discovery

El gateway descubre automáticamente nuevos servicios si:
1. Están configurados en variables de entorno
2. Responden al endpoint `/health`
3. Devuelven status 200 o 503

---

## CORS Configuration

### Configuración Actual

```typescript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ]
}
```

### URLs Permitidas

**Desarrollo:**
- `http://localhost:3000` (Vite dev server)
- `http://localhost:3005` (Next.js dev server)
- `http://localhost:5173` (Alternative Vite port)

**Producción:**
- Configurar `FRONTEND_URL` en `.env` con la URL del frontend desplegado

---

## Rate Limiting

**Actualmente NO implementado**

Para producción se recomienda:
- 100 requests/minuto por IP
- 1000 requests/hora por usuario autenticado
- Usar `express-rate-limit` o similar

---

## Authentication

**Actualmente NO implementado en el gateway**

El gateway NO valida tokens. La autenticación se maneja:
- En el frontend (Keycloak)
- En servicios backend individuales (si requieren auth)

Para implementar auth en el gateway:
1. Agregar middleware de validación JWT
2. Verificar token en header `Authorization: Bearer <token>`
3. Rechazar requests no autenticados con 401

---

## Monitoring

### Logs

Todos los requests se loguean con el siguiente formato:

```json
{
  "timestamp": "2024-11-06T10:00:00.000Z",
  "level": "info",
  "method": "POST",
  "path": "/shipping/cost",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "targetService": "shipping-service",
  "statusCode": 201,
  "responseTime": 234,
  "userAgent": "Mozilla/5.0...",
  "clientIp": "192.168.1.1"
}
```

### Métricas Recomendadas

- **Requests por segundo**: Total y por servicio
- **Response Time**: P50, P95, P99
- **Error Rate**: % de 4xx y 5xx
- **Service Availability**: % uptime de cada backend
- **Gateway Uptime**: % de tiempo activo del gateway

---

## Testing

### Tests E2E Disponibles

```bash
# Todos los tests E2E
npm run test:e2e

# Tests específicos
npm run test:e2e config.coverage-zones.e2e.spec.ts
npm run test:e2e config.transport-methods.e2e.spec.ts
npm run test:e2e config.tariff-configs.e2e.spec.ts
npm run test:e2e shipping.health.e2e.spec.ts
npm run test:e2e shipping.quotes.e2e.spec.ts
npm run test:e2e stock.health.e2e.spec.ts
npm run test:e2e gateway.unknown.e2e.spec.ts
```

### Archivos de Test

- `/test/e2e/config.*.e2e.spec.ts` - Tests de config endpoints
- `/test/e2e/shipping.*.e2e.spec.ts` - Tests de proxy a shipping
- `/test/e2e/stock.*.e2e.spec.ts` - Tests de proxy a stock
- `/test/e2e/gateway.*.e2e.spec.ts` - Tests del gateway mismo

---

## Troubleshooting

### 502 Bad Gateway en Todos los Servicios

**Causas:**
1. Servicios backend no están corriendo
2. URLs de servicios mal configuradas en `.env`
3. Firewall bloqueando conexiones

**Solución:**
```bash
# Verificar servicios
curl http://localhost:3003/health  # Config
curl http://localhost:3001/health  # Shipping
curl http://localhost:3002/health  # Stock

# Verificar configuración
cat .env | grep SERVICE_URL

# Reiniciar servicios
npm run start:all
```

### Request ID No Aparece en Logs

**Causa:** Frontend no está enviando header X-Request-ID

**Solución:** El gateway genera automáticamente uno si no viene en el request.

### CORS Errors

**Síntomas:** Browser blocking requests con error CORS

**Verificar:**
1. `FRONTEND_URL` correctamente configurado en `.env`
2. Frontend corriendo en puerto esperado
3. Headers `Access-Control-Allow-Origin` en respuesta

**Solución:**
```bash
# Actualizar .env
FRONTEND_URL=http://localhost:5173

# Reiniciar gateway
npm run start
```

---

## Documentación Adicional

- **Gateway Architecture**: `/backend/services/operator-interface-service/GATEWAY.md`
- **JWT Implementation**: `/backend/services/operator-interface-service/JWT-IMPLEMENTATION-GUIDE.md`
- **Keycloak Config**: `/backend/services/operator-interface-service/KEYCLOAK-CONFIG.md`
- **Tests Guide**: `/backend/services/operator-interface-service/TESTS.md`
- **Swagger**: http://localhost:3004/api/docs

---

**Última actualización**: 2024-11-06
**Versión del servicio**: 1.0.0
**Mantenido por**: Grupo 12 - UTN FRRE
