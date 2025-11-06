# Shipping Service - API Endpoints

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Calcular Costo de Envío](#calcular-costo-de-envío)
- [Crear Envío](#crear-envío)
- [Listar Envíos](#listar-envíos)
- [Obtener Detalle de Envío](#obtener-detalle-de-envío)
- [Cancelar Envío](#cancelar-envío)
- [Health Check](#health-check)

---

## Información General

**Base URL**: `http://localhost:3001`
**API Gateway**: `http://localhost:3004/shipping`
**Swagger UI**: `http://localhost:3001/api/docs`

### Descripción
Servicio principal de operaciones de envío y logística. Gestiona cotizaciones, creación de envíos, seguimiento y cancelaciones. Incluye cálculo de costos basado en peso volumétrico, distancia y tarifas.

### Dependencias
- **Config Service** (3003): Obtiene tarifas y métodos de transporte
- **Stock Integration Service** (3002): Valida disponibilidad de productos

### Autenticación
Actualmente no requiere autenticación. Para producción se recomienda implementar JWT.

### Formato de Respuesta Estándar

```json
{
  "shipmentId": "uuid",
  "status": "PENDING | IN_TRANSIT | DELIVERED | CANCELLED",
  "trackingNumber": "string",
  "...campos específicos...",
  "createdAt": "ISO-8601 timestamp"
}
```

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 404 | Not Found - Envío no encontrado |
| 409 | Conflict - No se puede cancelar (ya entregado, etc.) |
| 422 | Unprocessable Entity - Validación de negocio fallida |
| 500 | Internal Server Error |

---

## Calcular Costo de Envío

### POST `/shipping/cost`

Calcula el costo de envío basado en origen, destino, productos y método de transporte.

#### Request Body

```json
{
  "origin": {
    "street": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "state": "CABA",
    "postalCode": "1043",
    "country": "Argentina"
  },
  "destination": {
    "street": "San Martín 567",
    "city": "Rosario",
    "state": "Santa Fe",
    "postalCode": "2000",
    "country": "Argentina"
  },
  "products": [
    {
      "productId": "PROD-001",
      "name": "Notebook Dell",
      "quantity": 2,
      "weight": 5.5,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 15
      }
    }
  ],
  "transportType": "GROUND"
}
```

#### Request Fields

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `origin` | Address | Sí | Dirección de origen |
| `destination` | Address | Sí | Dirección de destino |
| `products` | ProductRequest[] | Sí | Array de productos (mínimo 1) |
| `transportType` | Enum | Opcional | GROUND, AIR, EXPRESS, MARITIME |

**Address Object:**
- `street`: string, requerido
- `city`: string, requerido
- `state`: string, requerido
- `postalCode`: string, requerido, formato numérico
- `country`: string, requerido

**ProductRequest Object:**
- `productId`: string, requerido
- `name`: string, requerido
- `quantity`: number, requerido, >= 1
- `weight`: number, requerido, > 0 (en kg)
- `dimensions`: object, requerido
  - `length`: number, > 0 (en cm)
  - `width`: number, > 0 (en cm)
  - `height`: number, > 0 (en cm)

#### Response (201)

```json
{
  "quoteId": "quote-123e4567-e89b-12d3-a456-426614174000",
  "totalCost": 1250.50,
  "estimatedDeliveryDays": 3,
  "distance": 287.5,
  "transportType": "GROUND",
  "totalWeight": 11.0,
  "breakdown": {
    "baseCost": 500.00,
    "weightCost": 275.00,
    "distanceCost": 345.00,
    "volumetricWeight": 9.0,
    "surcharges": {
      "fuel": 75.00,
      "handling": 55.50
    }
  },
  "validUntil": "2024-11-06T18:00:00.000Z",
  "createdAt": "2024-11-06T10:00:00.000Z"
}
```

#### Response Fields

| Campo | Descripción |
|-------|-------------|
| `quoteId` | ID único de la cotización (puede usarse para crear envío) |
| `totalCost` | Costo total en ARS |
| `estimatedDeliveryDays` | Días estimados de entrega |
| `distance` | Distancia en kilómetros |
| `totalWeight` | Peso total calculado (usa peso volumétrico si es mayor) |
| `breakdown` | Desglose detallado de costos |
| `validUntil` | Fecha de expiración de la cotización |

#### Cálculo de Peso Volumétrico

```
Peso Volumétrico = (length × width × height) / 5000
Peso Cobrable = max(Peso Real, Peso Volumétrico)
```

#### Errores

**400 - Bad Request:**
```json
{
  "statusCode": 400,
  "message": [
    "products must contain at least 1 elements",
    "weight must be greater than 0"
  ],
  "error": "Bad Request"
}
```

**422 - Unprocessable Entity:**
```json
{
  "statusCode": 422,
  "message": "Código postal '9999' no válido o fuera de zona de cobertura",
  "error": "Unprocessable Entity"
}
```

#### Ejemplos de Uso

**Envío Simple:**
```bash
curl -X POST http://localhost:3001/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "street": "Calle 123",
      "city": "Buenos Aires",
      "state": "CABA",
      "postalCode": "1000",
      "country": "Argentina"
    },
    "destination": {
      "street": "Av. Principal 456",
      "city": "Córdoba",
      "state": "Córdoba",
      "postalCode": "5000",
      "country": "Argentina"
    },
    "products": [
      {
        "productId": "PROD-001",
        "name": "Paquete",
        "quantity": 1,
        "weight": 2.5,
        "dimensions": {
          "length": 20,
          "width": 15,
          "height": 10
        }
      }
    ],
    "transportType": "EXPRESS"
  }'
```

---

## Crear Envío

### POST `/shipping`

Crea un nuevo envío basado en la cotización o con datos directos.

#### Request Body

```json
{
  "userId": "user-12345",
  "quoteId": "quote-123e4567-e89b-12d3-a456-426614174000",
  "origin": {
    "street": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "state": "CABA",
    "postalCode": "1043",
    "country": "Argentina"
  },
  "destination": {
    "street": "San Martín 567",
    "city": "Rosario",
    "state": "Santa Fe",
    "postalCode": "2000",
    "country": "Argentina"
  },
  "products": [
    {
      "productId": "PROD-001",
      "name": "Notebook Dell",
      "quantity": 2,
      "weight": 5.5,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 15
      }
    }
  ],
  "transportType": "GROUND",
  "paymentMethod": "CREDIT_CARD",
  "notes": "Entregar en horario de oficina"
}
```

#### Request Fields

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `userId` | string | Sí | Identificador del usuario/cliente |
| `quoteId` | string | Opcional | ID de cotización previa (aplica costos pre-calculados) |
| `origin` | Address | Sí | Dirección de origen |
| `destination` | Address | Sí | Dirección de destino |
| `products` | ProductRequest[] | Sí | Array de productos |
| `transportType` | Enum | Opcional | Tipo de transporte |
| `paymentMethod` | Enum | Opcional | CASH, CREDIT_CARD, BANK_TRANSFER |
| `notes` | string | Opcional | Notas adicionales |

#### Response (201)

```json
{
  "shipmentId": "ship-123e4567-e89b-12d3-a456-426614174099",
  "userId": "user-12345",
  "trackingNumber": "LOG-2024-0001234",
  "status": "PENDING",
  "origin": {
    "street": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "state": "CABA",
    "postalCode": "1043",
    "country": "Argentina"
  },
  "destination": {
    "street": "San Martín 567",
    "city": "Rosario",
    "state": "Santa Fe",
    "postalCode": "2000",
    "country": "Argentina"
  },
  "products": [...],
  "transportType": "GROUND",
  "totalCost": 1250.50,
  "estimatedDeliveryDate": "2024-11-09T18:00:00.000Z",
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

#### Estados del Envío

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Envío creado, pendiente de procesamiento |
| `PROCESSING` | En proceso de preparación |
| `IN_TRANSIT` | En tránsito hacia destino |
| `OUT_FOR_DELIVERY` | En reparto final |
| `DELIVERED` | Entregado exitosamente |
| `CANCELLED` | Cancelado por usuario o sistema |
| `FAILED` | Fallo en la entrega |

#### Errores

**400 - Bad Request:**
- Datos inválidos
- Productos vacíos
- Pesos o dimensiones negativas/cero

**404 - Not Found:**
- quoteId no encontrado o expirado

---

## Listar Envíos

### GET `/shipping`

Lista envíos con filtros y paginación.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `user_id` | string | No | Filtrar por ID de usuario |
| `status` | string | No | Filtrar por estado (PENDING, IN_TRANSIT, etc.) |
| `from_date` | string | No | Fecha inicio (ISO-8601) |
| `to_date` | string | No | Fecha fin (ISO-8601) |
| `page` | number | No | Número de página (default: 1) |
| `limit` | number | No | Resultados por página (default: 20, max: 100) |

#### Response (200)

```json
{
  "shipments": [
    {
      "shipmentId": "ship-001",
      "userId": "user-12345",
      "trackingNumber": "LOG-2024-0001234",
      "status": "IN_TRANSIT",
      "totalCost": 1250.50,
      "estimatedDeliveryDate": "2024-11-09T18:00:00.000Z",
      "createdAt": "2024-11-06T10:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

#### Ejemplos

```bash
# Todos los envíos del usuario
GET /shipping?user_id=user-12345

# Envíos en tránsito
GET /shipping?status=IN_TRANSIT

# Envíos del último mes
GET /shipping?from_date=2024-10-01&to_date=2024-10-31

# Paginación
GET /shipping?page=2&limit=50
```

---

## Obtener Detalle de Envío

### GET `/shipping/:id`

Obtiene información detallada de un envío específico.

#### Path Parameters

- `id` (UUID) - Identificador del envío

#### Response (200)

```json
{
  "shipmentId": "ship-123e4567-e89b-12d3-a456-426614174099",
  "userId": "user-12345",
  "trackingNumber": "LOG-2024-0001234",
  "status": "IN_TRANSIT",
  "origin": {...},
  "destination": {...},
  "products": [...],
  "transportType": "GROUND",
  "totalCost": 1250.50,
  "estimatedDeliveryDate": "2024-11-09T18:00:00.000Z",
  "history": [
    {
      "timestamp": "2024-11-06T10:00:00.000Z",
      "status": "PENDING",
      "location": "Centro de Distribución CABA",
      "description": "Envío recibido y procesado"
    },
    {
      "timestamp": "2024-11-06T14:30:00.000Z",
      "status": "IN_TRANSIT",
      "location": "En ruta hacia Rosario",
      "description": "Envío en tránsito"
    }
  ],
  "driver": {
    "name": "Juan Pérez",
    "phone": "+54911234567"
  },
  "vehicle": {
    "licensePlate": "ABC-123",
    "type": "Van"
  },
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T14:30:00.000Z"
}
```

#### Errores

**400 - Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid UUID format",
  "error": "Bad Request"
}
```

**404 - Not Found:**
```json
{
  "statusCode": 404,
  "message": "Shipment with ID 'ship-123...' not found",
  "error": "Not Found"
}
```

---

## Cancelar Envío

### POST `/shipping/:id/cancel`

Cancela un envío existente (solo si está en estado PENDING o PROCESSING).

#### Path Parameters

- `id` (UUID) - Identificador del envío

#### Request Body (opcional)

```json
{
  "reason": "Cliente solicitó cancelación",
  "refund": true
}
```

#### Response (200)

```json
{
  "shipmentId": "ship-123e4567-e89b-12d3-a456-426614174099",
  "status": "CANCELLED",
  "message": "Envío cancelado exitosamente",
  "cancelledAt": "2024-11-06T15:00:00.000Z",
  "refundAmount": 1250.50,
  "refundStatus": "PENDING"
}
```

#### Errores

**400 - Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Cannot cancel shipment in status 'DELIVERED'",
  "error": "Bad Request"
}
```

**404 - Not Found:**
- Envío no encontrado

**409 - Conflict:**
```json
{
  "statusCode": 409,
  "message": "Shipment already cancelled",
  "error": "Conflict"
}
```

#### Reglas de Negocio

- ✅ Se puede cancelar: `PENDING`, `PROCESSING`
- ❌ NO se puede cancelar: `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`

---

## Health Check

### GET `/health`

Verifica el estado del servicio y sus dependencias.

#### Response (200)

```json
{
  "status": "ok",
  "timestamp": "2024-11-06T10:00:00.000Z",
  "service": "shipping-service",
  "dependencies": {
    "configService": {
      "status": "up",
      "url": "http://localhost:3003"
    },
    "stockService": {
      "status": "up",
      "url": "http://localhost:3002"
    }
  }
}
```

#### Response (503)

```json
{
  "status": "degraded",
  "timestamp": "2024-11-06T10:00:00.000Z",
  "service": "shipping-service",
  "dependencies": {
    "configService": {
      "status": "down",
      "error": "Connection timeout"
    },
    "stockService": {
      "status": "up"
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
  "service": "shipping-service",
  "version": "1.0.0",
  "description": "Core shipping and logistics operations"
}
```

---

## Características Técnicas

### Caché de Cotizaciones
- Las cotizaciones se cachean por 30 minutos
- Cache key basado en hash de: origin + destination + products + transportType
- Implementado con Redis

### Cálculo de Distancia
- Usa librería `geolib` para cálculo de distancia geodésica
- Basado en coordenadas lat/long obtenidas de códigos postales
- Fallback a distancia estimada si geocoding falla

### Validación de Códigos Postales
- Valida formato numérico argentino (4 dígitos)
- Verifica existencia en base de datos de zonas de cobertura
- Rechaza envíos a zonas no cubiertas

### Integración con Config Service
- Obtiene tarifas y métodos de transporte en tiempo real
- Circuit breaker para manejo de fallos
- Timeout de 5 segundos por request

### Integración con Stock Service
- Valida disponibilidad de productos antes de crear envío
- Reserva stock automáticamente al crear envío
- Libera stock si cancelación es exitosa

---

## Testing

Todos los endpoints tienen tests E2E completos en `/test/e2e/`:
- `shipping-cost.e2e-spec.ts` - Tests de cálculo de costos
- `shipping-operations.e2e-spec.ts` - Tests de CRUD de envíos
- `health.e2e-spec.ts` - Tests de health check

**Ejecutar tests:**
```bash
npm run test:e2e
```

**Ver cobertura:**
```bash
npm run test:cov
```

---

## Ejemplos Completos

### Flujo Completo: Cotización → Creación → Seguimiento → Cancelación

```bash
# 1. Calcular costo
QUOTE_RESPONSE=$(curl -X POST http://localhost:3001/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{...}')

QUOTE_ID=$(echo $QUOTE_RESPONSE | jq -r '.quoteId')

# 2. Crear envío
SHIPMENT_RESPONSE=$(curl -X POST http://localhost:3001/shipping \
  -H "Content-Type: application/json" \
  -d "{\"quoteId\": \"$QUOTE_ID\", ...}")

SHIPMENT_ID=$(echo $SHIPMENT_RESPONSE | jq -r '.shipmentId')

# 3. Consultar estado
curl http://localhost:3001/shipping/$SHIPMENT_ID

# 4. Cancelar si es necesario
curl -X POST http://localhost:3001/shipping/$SHIPMENT_ID/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cliente cambió de opinión"}'
```

---

**Última actualización**: 2024-11-06
**Versión del servicio**: 1.0.0
**Mantenido por**: Grupo 12 - UTN FRRE
