# 📡 Documentación de API - Módulo de Logística

## 🎯 Visión General

El módulo de logística expone múltiples APIs REST organizadas por microservicios. Cada microservicio tiene su propia documentación Swagger/OpenAPI disponible en `/api/docs`.

## 🏗️ Arquitectura de APIs

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND / CLIENTES                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            OPERATOR INTERFACE SERVICE (Puerto 3004)         │
│              API Gateway / Agregador de APIs                │
│              Swagger: http://localhost:3004/api/docs        │
└────────┬──────────────────┬────────────────┬────────────────┘
         │                  │                │
         ▼                  ▼                ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ CONFIG SERVICE │  │ STOCK SERVICE  │  │SHIPPING SERVICE│
│  Puerto: 3003  │  │  Puerto: 3002  │  │  Puerto: 3001  │
└────────────────┘  └────────────────┘  └────────────────┘
```

## 🔗 URLs de Documentación Swagger

| Servicio | Puerto | URL Swagger | Descripción |
|----------|--------|-------------|-------------|
| **Operator Interface** | 3004 | http://localhost:3004/api/docs | API principal para frontend |
| **Shipping Service** | 3001 | http://localhost:3001/api/docs | Gestión de envíos |
| **Stock Integration** | 3002 | http://localhost:3002/api/docs | Integración con Stock |
| **Config Service** | 3003 | http://localhost:3003/api/docs | Configuración de transporte |

## 📋 Endpoints por Servicio

### 1. Operator Interface Service (Puerto 3004)

**Propósito**: API Gateway que agrega funcionalidad de otros servicios para el frontend.

#### Configuración
- `GET /api/config/transport-methods` - Listar métodos de transporte
- `GET /api/config/transport-methods/:id` - Obtener método específico
- `POST /api/config/transport-methods` - Crear método de transporte
- `PUT /api/config/transport-methods/:id` - Actualizar método
- `DELETE /api/config/transport-methods/:id` - Eliminar método

- `GET /api/config/coverage-zones` - Listar zonas de cobertura
- `GET /api/config/coverage-zones/:id` - Obtener zona específica
- `POST /api/config/coverage-zones` - Crear zona de cobertura
- `PUT /api/config/coverage-zones/:id` - Actualizar zona
- `DELETE /api/config/coverage-zones/:id` - Eliminar zona

#### Health Check
- `GET /health` - Estado del servicio

---

### 2. Shipping Service (Puerto 3001)

**Propósito**: Gestión completa del ciclo de vida de envíos.

#### Envíos
- `POST /api/shipping` - Crear nuevo envío
- `GET /api/shipping/:id` - Obtener detalles de envío
- `GET /api/shipping` - Listar envíos (con filtros)
- `PUT /api/shipping/:id/status` - Actualizar estado
- `DELETE /api/shipping/:id` - Cancelar envío

#### Cotización
- `POST /api/shipping/quote` - Calcular costo de envío

**Request Body (Quote)**:
```json
{
  "products": [
    {
      "productId": 123,
      "quantity": 2,
      "weight": 5.5,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 15
      }
    }
  ],
  "destination": {
    "street": "Av. Libertad 5450",
    "city": "Resistencia",
    "state": "Chaco",
    "postalCode": "3500",
    "country": "AR"
  },
  "transportType": "ROAD"
}
```

**Response**:
```json
{
  "estimatedCost": 1250.50,
  "currency": "ARS",
  "estimatedDeliveryDate": "2025-10-25T10:00:00.000Z",
  "transportMethod": {
    "id": "uuid",
    "name": "Transporte Terrestre Estándar",
    "code": "ROAD_STD"
  }
}
```

#### Health Check
- `GET /health` - Estado del servicio

---

### 3. Stock Integration Service (Puerto 3002)

**Propósito**: Cliente HTTP para integración con el módulo de Stock externo.

#### Productos
- `GET /api/stock/products/:id` - Obtener producto desde Stock
- `GET /api/stock/products` - Listar productos disponibles
- `POST /api/stock/products/validate` - Validar disponibilidad

#### Reservas
- `POST /api/stock/reservas` - Crear reserva de stock
- `GET /api/stock/reservas/:id` - Obtener detalles de reserva
- `PUT /api/stock/reservas/:id/cancel` - Cancelar reserva

**Características**:
- ✅ Circuit Breaker (protección ante fallos)
- ✅ Reintentos automáticos (3 intentos)
- ✅ Cache con Redis (TTL: 5 minutos)
- ✅ Fallback a datos mock en caso de falla

**Request Example**:
```json
POST /api/stock/reservas
{
  "orderId": 456,
  "productos": [
    {
      "productoId": 123,
      "cantidad": 5
    }
  ]
}
```

**Response**:
```json
{
  "reservaId": "uuid",
  "orderId": 456,
  "estado": "RESERVADO",
  "fechaReserva": "2025-10-18T10:00:00.000Z",
  "fechaExpiracion": "2025-10-18T22:00:00.000Z",
  "productos": [
    {
      "productoId": 123,
      "cantidad": 5,
      "reservado": true
    }
  ]
}
```

#### Health Check
- `GET /health` - Estado del servicio
  - Incluye estado del Stock API externo
  - Estado del Circuit Breaker
  - Métricas de cache

---

### 4. Config Service (Puerto 3003)

**Propósito**: Gestión de configuración de métodos de transporte y zonas de cobertura.

#### Métodos de Transporte
- `GET /api/transport-methods` - Listar métodos
- `GET /api/transport-methods/:id` - Obtener método específico
- `POST /api/transport-methods` - Crear método
- `PUT /api/transport-methods/:id` - Actualizar método
- `PATCH /api/transport-methods/:id/status` - Activar/desactivar
- `DELETE /api/transport-methods/:id` - Eliminar método

**Model**:
```typescript
{
  id: string;
  code: string;              // Ej: "ROAD_STD"
  name: string;              // Ej: "Transporte Terrestre Estándar"
  description?: string;
  averageSpeed: number;      // km/h
  estimatedDays: string;     // Ej: "3-5"
  baseCostPerKm: number;     // Costo por kilómetro
  baseCostPerKg: number;     // Costo por kilogramo
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Zonas de Cobertura
- `GET /api/coverage-zones` - Listar zonas
- `GET /api/coverage-zones/:id` - Obtener zona específica
- `POST /api/coverage-zones` - Crear zona
- `PUT /api/coverage-zones/:id` - Actualizar zona
- `PATCH /api/coverage-zones/:id/postal-codes` - Actualizar CPs
- `DELETE /api/coverage-zones/:id` - Eliminar zona

**Model**:
```typescript
{
  id: string;
  name: string;              // Ej: "Zona Norte"
  description?: string;
  postalCodes: string[];     // Array de códigos postales
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Configuración de Tarifas
- `GET /api/tariffs` - Listar configuraciones de tarifas
- `GET /api/tariffs/:id` - Obtener tarifa específica
- `POST /api/tariffs` - Crear configuración de tarifa
- `PUT /api/tariffs/:id` - Actualizar tarifa

**Model**:
```typescript
{
  id: string;
  transportMethodId: string;
  baseTariff: number;
  costPerKg: number;
  costPerKm: number;
  volumetricFactor: number;  // Para cálculo peso volumétrico
  environment: string;        // "development" | "staging" | "production"
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
}
```

#### Health Check
- `GET /health` - Estado del servicio

---

## 🔒 Autenticación y Seguridad

### Headers Requeridos

```http
Content-Type: application/json
Accept: application/json
```

### Autenticación (Futuro)

Actualmente los endpoints están abiertos para desarrollo. En producción se implementará:

- **Keycloak** para autenticación
- **JWT** tokens
- **RBAC** (Role-Based Access Control)

```http
Authorization: Bearer <token>
```

---

## 📝 Formatos de Respuesta

### Respuesta Exitosa

```json
{
  "data": { /* ... */ },
  "message": "Success",
  "timestamp": "2025-10-18T10:00:00.000Z"
}
```

### Respuesta de Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "products",
      "message": "products must be an array"
    }
  ],
  "timestamp": "2025-10-18T10:00:00.000Z",
  "path": "/api/shipping/quote"
}
```

### Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `400` | Request inválido |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: recurso duplicado) |
| `500` | Error interno del servidor |
| `503` | Servicio no disponible |

---

## 🧪 Testing de APIs

### Usar Swagger UI

1. Navegar a http://localhost:3004/api/docs
2. Expandir el endpoint deseado
3. Click en "Try it out"
4. Completar parámetros
5. Click en "Execute"

### Usar cURL

**Crear envío**:
```bash
curl -X POST http://localhost:3001/api/shipping \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 123,
    "userId": 456,
    "products": [
      {
        "productId": 789,
        "quantity": 2
      }
    ],
    "destination": {
      "street": "Av. Libertad 5450",
      "city": "Resistencia",
      "state": "Chaco",
      "postalCode": "3500",
      "country": "AR"
    },
    "transportType": "ROAD"
  }'
```

**Obtener cotización**:
```bash
curl -X POST http://localhost:3001/api/shipping/quote \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "productId": 123,
        "quantity": 1,
        "weight": 5.0,
        "dimensions": {
          "length": 30,
          "width": 20,
          "height": 10
        }
      }
    ],
    "destination": {
      "postalCode": "3500"
    },
    "transportType": "ROAD"
  }'
```

## 📊 Rate Limiting

**En desarrollo**: Sin límites

**Producción (futuro)**:
- 100 requests/minuto por IP
- 1000 requests/hora por usuario autenticado

---

## 🌍 CORS

Configuración actual (desarrollo):
```javascript
origin: ['http://localhost:3005', 'http://localhost:3000']
```

Producción:
```javascript
origin: ['https://logistica.ds.frre.utn.edu.ar']
```

---

## 📚 Recursos Adicionales

- [OpenAPI Specification](../../openapilog.yaml)
- [API Testing Guide](../../TESTING.md)
- [Architecture Documentation](../architecture/README.md)

---

## 🐛 Reporte de Issues

Reportar problemas de API en:
https://github.com/FRRe-DS/2025-12-TPI/issues

**Template**:
```markdown
### Endpoint
POST /api/shipping

### Request
```json
{ ... }
```

### Respuesta Esperada
...

### Respuesta Actual
...

### Pasos para Reproducir
1. ...
2. ...
```

---

**Última actualización**: 2025-10-18
**Versión**: 1.0.0
**Mantenido por**: Grupo 12 - UTN FRRE
