# API Specification para Backend

## Índice

1. [Resumen General](#resumen-general)
2. [Arquitectura Sugerida](#arquitectura-sugerida)
3. [Endpoints Implementados](#endpoints-implementados)
4. [Endpoints Pendientes](#endpoints-pendientes)
5. [Modelos de Datos](#modelos-de-datos)
6. [Códigos de Error](#códigos-de-error)
7. [Autenticación](#autenticación)
8. [Testing](#testing)

---

## Resumen General

El frontend está construido con las siguientes características:
- **Framework**: Next.js 16 + React 19 + TypeScript
- **HTTP Client**: Axios con interceptores
- **Base URL**: Configurable vía `NEXT_PUBLIC_API_URL` (default: `http://localhost:3004`)
- **Autenticación**: Keycloak (Bearer token en header `Authorization`)
- **Formato de respuesta**: JSON
- **Manejo de errores**: Status codes HTTP estándar

### Estructura del proyecto backend sugerida

```
backend/
├── src/
│   ├── controllers/          # Controladores (handlers de rutas)
│   ├── services/             # Lógica de negocio
│   ├── repositories/         # Acceso a datos
│   ├── models/               # Modelos/DTOs
│   ├── middlewares/          # Middlewares (auth, logging, etc.)
│   └── routes/               # Definición de rutas
```

---

## Arquitectura Sugerida

### Patrón de Capas

```
┌─────────────────────────────────┐
│   Controllers                    │  ← Validación de entrada, mapeo de DTOs
│   (HTTP Layer)                   │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Services                       │  ← Lógica de negocio
│   (Business Layer)               │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Repositories                   │  ← Acceso a base de datos
│   (Data Access Layer)            │
└─────────────────────────────────┘
```

### Ejemplo de Implementación Modular

```typescript
// controllers/reports.controller.ts
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  async getKPIs(req: Request, res: Response) {
    const { from, to } = req.query;
    const data = await this.reportsService.getKPIs(from, to);
    res.json(data);
  }
}

// services/reports.service.ts
export class ReportsService {
  constructor(
    private shipmentsRepo: ShipmentsRepository,
    private metricsCalculator: MetricsCalculator
  ) {}

  async getKPIs(from?: string, to?: string): Promise<KPIData> {
    const shipments = await this.shipmentsRepo.getShipments({ from, to });
    return this.metricsCalculator.calculate(shipments);
  }
}

// repositories/shipments.repository.ts
export class ShipmentsRepository {
  async getShipments(filters: ShipmentFilters): Promise<Shipment[]> {
    // Query a la base de datos
  }
}
```

---

## Endpoints Implementados

Estos endpoints ya están definidos en el frontend y necesitan implementación backend:

### 1. Health Check

```http
GET /health
```

**Headers:** Ninguno requerido

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T14:00:00.000Z",
  "services": {
    "database": "up",
    "cache": "up"
  }
}
```

---

## Endpoints Pendientes

### REPORTES Y KPIs

#### 1. GET /reports/kpis

Obtiene métricas y KPIs para el dashboard de reportes.

**Método:** `GET`
**Ruta:** `/reports/kpis`
**Autenticación:** Requerida

**Query Parameters:**
```typescript
{
  from?: string;  // ISO date: "2025-01-01"
  to?: string;    // ISO date: "2025-12-31"
}
```

**Response:** `200 OK`
```json
{
  "totalShipments": {
    "today": 45,
    "week": 312,
    "month": 1248
  },
  "deliverySuccessRate": 87.5,
  "averageDeliveryTime": 36.2,
  "shipmentsByStatus": [
    {
      "status": "Entregado",
      "count": 1092,
      "percentage": 87.5
    },
    {
      "status": "En tránsito",
      "count": 89,
      "percentage": 7.1
    },
    {
      "status": "Pendiente",
      "count": 45,
      "percentage": 3.6
    },
    {
      "status": "Cancelado",
      "count": 22,
      "percentage": 1.8
    }
  ],
  "timelineData": [
    {
      "date": "Nov 01",
      "shipments": 42,
      "delivered": 38,
      "cancelled": 2
    },
    {
      "date": "Nov 02",
      "shipments": 48,
      "delivered": 45,
      "cancelled": 1
    }
    // ... últimos 30 días
  ],
  "transportTypeDistribution": [
    {
      "type": "Terrestre Express",
      "count": 499,
      "percentage": 40.0
    },
    {
      "type": "Terrestre Estándar",
      "count": 374,
      "percentage": 30.0
    },
    {
      "type": "Aéreo",
      "count": 250,
      "percentage": 20.0
    },
    {
      "type": "Marítimo",
      "count": 125,
      "percentage": 10.0
    }
  ],
  "statusDistribution": [
    {
      "status": "Entregado",
      "count": 1092
    },
    {
      "status": "En tránsito",
      "count": 89
    },
    {
      "status": "Pendiente",
      "count": 45
    },
    {
      "status": "Cancelado",
      "count": 22
    }
  ],
  "topZones": [
    {
      "zone": "Bogotá Centro",
      "shipments": 312
    },
    {
      "zone": "Medellín Norte",
      "shipments": 250
    },
    {
      "zone": "Cali Sur",
      "shipments": 225
    },
    {
      "zone": "Barranquilla Este",
      "shipments": 187
    },
    {
      "zone": "Cartagena",
      "shipments": 150
    }
  ]
}
```

**Lógica de Negocio:**
```typescript
// Pseudocódigo
function calculateKPIs(from: Date, to: Date): KPIData {
  // 1. Query shipments en el rango de fechas
  const shipments = db.shipments.find({ createdAt: { $gte: from, $lte: to } });

  // 2. Calcular total de envíos por período
  const today = shipments.filter(s => isToday(s.createdAt));
  const week = shipments.filter(s => isLastDays(s.createdAt, 7));
  const month = shipments.filter(s => isLastDays(s.createdAt, 30));

  // 3. Calcular tasa de éxito
  const delivered = shipments.filter(s => s.status === 'DELIVERED');
  const successRate = (delivered.length / shipments.length) * 100;

  // 4. Calcular tiempo promedio de entrega
  const deliveryTimes = delivered.map(s =>
    (s.actualDeliveryDate - s.createdAt) / (1000 * 60 * 60) // horas
  );
  const avgDeliveryTime = deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length;

  // 5. Agrupar por estado, tipo de transporte, zonas
  // ... resto de cálculos

  return { ... };
}
```

**Errores:**
- `401 Unauthorized`: Token inválido o expirado
- `500 Internal Server Error`: Error del servidor

---

### TRACKING PÚBLICO

#### 2. GET /shipping/track/:id

Obtiene información de seguimiento de un envío (sin autenticación).

**Método:** `GET`
**Ruta:** `/shipping/track/:id`
**Autenticación:** NO requerida (público)

**URL Parameters:**
```typescript
{
  id: string;  // Puede ser shipping_id o tracking_number
}
```

**Response:** `200 OK`
```json
{
  "id": "abc123def456",
  "trackingNumber": "TRKABC12345",
  "status": "IN_TRANSIT",
  "statusDescription": "En tránsito",
  "currentLocation": "Centro de Distribución - Medellín",
  "estimatedDeliveryDate": "2025-11-10T18:00:00.000Z",
  "actualDeliveryDate": null,
  "destinationAddress": {
    "city": "Bogotá",
    "state": "Cundinamarca",
    "postalCode": "110111"
  },
  "transportMethod": "Terrestre Express",
  "events": [
    {
      "status": "IN_TRANSIT",
      "description": "Paquete en reparto, será entregado hoy",
      "timestamp": "2025-11-08T10:30:00.000Z",
      "location": "Centro de Distribución - Medellín"
    },
    {
      "status": "IN_TRANSIT",
      "description": "En camino al destino",
      "timestamp": "2025-11-07T14:20:00.000Z",
      "location": "En ruta"
    },
    {
      "status": "PROCESSING",
      "description": "Paquete preparado para envío",
      "timestamp": "2025-11-06T09:15:00.000Z",
      "location": "Centro de Distribución - Bogotá"
    },
    {
      "status": "PENDING",
      "description": "Pedido recibido y en procesamiento",
      "timestamp": "2025-11-05T16:45:00.000Z",
      "location": "Centro de Distribución - Bogotá"
    }
  ],
  "labelUrl": "/api/labels/abc123def456.pdf"
}
```

**Estados Posibles:**
- `PENDING`: Pendiente de procesamiento
- `PROCESSING`: En preparación
- `IN_TRANSIT`: En tránsito
- `OUT_FOR_DELIVERY`: Fuera para entrega
- `DELIVERED`: Entregado
- `CANCELLED`: Cancelado

**Lógica de Negocio:**
```typescript
function getTrackingInfo(idOrTrackingNumber: string): PublicTrackingDTO {
  // 1. Buscar shipment por ID o tracking number
  const shipment = db.shipments.findOne({
    $or: [
      { id: idOrTrackingNumber },
      { trackingNumber: idOrTrackingNumber }
    ]
  });

  if (!shipment) {
    throw new NotFoundError('Envío no encontrado');
  }

  // 2. Obtener eventos de tracking
  const events = db.trackingEvents
    .find({ shipmentId: shipment.id })
    .sort({ timestamp: -1 }); // Más reciente primero

  // 3. Ocultar información sensible (solo datos parciales)
  const maskedAddress = {
    city: shipment.destinationAddress.city,
    state: shipment.destinationAddress.state,
    postalCode: shipment.destinationAddress.postalCode
    // NO incluir: calle, número, nombre del destinatario
  };

  return {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    statusDescription: getStatusDescription(shipment.status),
    currentLocation: events[0]?.location,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate,
    actualDeliveryDate: shipment.actualDeliveryDate,
    destinationAddress: maskedAddress,
    transportMethod: shipment.transportMethod.name,
    events: events,
    labelUrl: `/api/labels/${shipment.id}.pdf`
  };
}
```

**Errores:**
- `404 Not Found`: Envío no encontrado
```json
{
  "error": "NOT_FOUND",
  "message": "Envío no encontrado"
}
```
- `500 Internal Server Error`: Error del servidor

**Consideraciones de Seguridad:**
- ⚠️ **NO exponer información sensible** (nombre completo, dirección exacta, teléfono, email)
- ✅ Solo mostrar ciudad, estado y código postal
- ✅ No requerir autenticación (es público)
- ✅ Rate limiting recomendado (max 100 requests/minuto por IP)

---

### GESTIÓN DE ENVÍOS (Autenticado)

#### 3. GET /shipping

Lista envíos con filtros (para el dashboard interno).

**Método:** `GET`
**Ruta:** `/shipping`
**Autenticación:** Requerida

**Query Parameters:**
```typescript
{
  status?: string;           // 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | etc.
  startDate?: string;        // ISO date
  endDate?: string;          // ISO date
  originZone?: string;
  destinationZone?: string;
  transportMethodId?: string;
  page?: number;             // Default: 1
  limit?: number;            // Default: 20
  sortBy?: string;           // 'createdAt' | 'estimatedDeliveryDate'
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
}
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "abc123",
      "orderId": 1001,
      "originAddress": {
        "street": "Calle 100 #15-20",
        "city": "Bogotá",
        "state": "Cundinamarca",
        "postal_code": "110111",
        "country": "Colombia"
      },
      "destinationAddress": {
        "street": "Carrera 43A #14-58",
        "city": "Medellín",
        "state": "Antioquia",
        "postal_code": "050001",
        "country": "Colombia"
      },
      "products": [
        {
          "id": "prod-001",
          "name": "Laptop Dell XPS 13",
          "weight": 1.5,
          "dimensions": {
            "width": 30,
            "height": 20,
            "depth": 2
          },
          "quantity": 1,
          "price": 4500000
        }
      ],
      "transportMethod": {
        "id": "tm-001",
        "name": "Terrestre Express"
      },
      "status": "IN_TRANSIT",
      "totalCost": 150000,
      "createdAt": "2025-11-05T16:45:00.000Z",
      "estimatedDeliveryDate": "2025-11-10T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

**Lógica de Negocio:**
```typescript
function getShipments(filters: ShipmentFilters): PaginatedResponse {
  // 1. Construir query con filtros
  const query = buildQuery(filters);

  // 2. Aplicar paginación
  const skip = (filters.page - 1) * filters.limit;

  // 3. Query
  const shipments = db.shipments
    .find(query)
    .sort({ [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(filters.limit);

  const total = db.shipments.countDocuments(query);

  return {
    data: shipments,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit)
    }
  };
}
```

**Errores:**
- `401 Unauthorized`: No autenticado
- `400 Bad Request`: Parámetros inválidos
- `500 Internal Server Error`

---

#### 4. GET /shipping/:id

Obtiene detalles completos de un envío (autenticado).

**Método:** `GET`
**Ruta:** `/shipping/:id`
**Autenticación:** Requerida

**Response:** `200 OK`
```json
{
  "id": "abc123",
  "orderId": 1001,
  "trackingNumber": "TRKABC12345",
  "originAddress": { /* ... */ },
  "destinationAddress": { /* ... */ },
  "products": [ /* ... */ ],
  "transportMethod": { /* ... */ },
  "status": "IN_TRANSIT",
  "totalCost": 150000,
  "createdAt": "2025-11-05T16:45:00.000Z",
  "estimatedDeliveryDate": "2025-11-10T18:00:00.000Z",
  "actualDeliveryDate": null,
  "events": [ /* trackingEvents */ ]
}
```

**Errores:**
- `401 Unauthorized`
- `404 Not Found`
- `500 Internal Server Error`

---

#### 5. POST /shipping

Crea un nuevo envío.

**Método:** `POST`
**Ruta:** `/shipping`
**Autenticación:** Requerida

**Request Body:**
```json
{
  "order_id": 1001,
  "user_id": 42,
  "delivery_address": {
    "street": "Carrera 43A #14-58",
    "city": "Medellín",
    "state": "Antioquia",
    "postal_code": "050001",
    "country": "Colombia"
  },
  "transport_type": "ROAD",
  "products": [
    {
      "id": 123,
      "quantity": 2
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "new-shipment-id",
  "orderId": 1001,
  "trackingNumber": "TRKNEW12345",
  "status": "PENDING",
  "estimatedDeliveryDate": "2025-11-15T18:00:00.000Z",
  "totalCost": 150000,
  "createdAt": "2025-11-08T14:00:00.000Z"
}
```

**Lógica de Negocio:**
```typescript
async function createShipment(dto: CreateShipmentDTO): Promise<Shipment> {
  // 1. Validar productos existen
  const products = await productRepo.findByIds(dto.products.map(p => p.id));

  // 2. Calcular costo
  const cost = await costCalculator.calculate(dto.delivery_address, products, dto.transport_type);

  // 3. Generar tracking number único
  const trackingNumber = generateTrackingNumber();

  // 4. Calcular ETA basado en tipo de transporte y distancia
  const eta = await etaCalculator.calculate(dto.delivery_address, dto.transport_type);

  // 5. Crear envío
  const shipment = await shipmentRepo.create({
    ...dto,
    trackingNumber,
    status: 'PENDING',
    totalCost: cost,
    estimatedDeliveryDate: eta,
    createdAt: new Date()
  });

  // 6. Crear evento inicial de tracking
  await trackingEventRepo.create({
    shipmentId: shipment.id,
    status: 'PENDING',
    description: 'Pedido recibido y en procesamiento',
    timestamp: new Date(),
    location: 'Centro de Distribución'
  });

  return shipment;
}
```

**Errores:**
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`
- `500 Internal Server Error`

---

#### 6. PATCH /shipping/:id

Actualiza un envío (principalmente para cambiar estado).

**Método:** `PATCH`
**Ruta:** `/shipping/:id`
**Autenticación:** Requerida

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "currentLocation": "Centro de Distribución - Medellín"
}
```

**Response:** `200 OK`
```json
{
  "id": "abc123",
  "status": "IN_TRANSIT",
  "updatedAt": "2025-11-08T14:00:00.000Z"
}
```

**Lógica:**
```typescript
async function updateShipment(id: string, dto: UpdateShipmentDTO) {
  const shipment = await shipmentRepo.findById(id);

  if (!shipment) throw new NotFoundError();

  // Si cambia el status, crear evento de tracking
  if (dto.status && dto.status !== shipment.status) {
    await trackingEventRepo.create({
      shipmentId: id,
      status: dto.status,
      description: getStatusDescription(dto.status),
      timestamp: new Date(),
      location: dto.currentLocation
    });
  }

  return shipmentRepo.update(id, dto);
}
```

**Errores:**
- `400 Bad Request`: Estado inválido
- `401 Unauthorized`
- `404 Not Found`
- `500 Internal Server Error`

---

#### 7. DELETE /shipping/:id

Cancela un envío (soft delete).

**Método:** `DELETE`
**Ruta:** `/shipping/:id`
**Autenticación:** Requerida

**Response:** `204 No Content`

**Lógica:**
```typescript
async function cancelShipment(id: string) {
  // Soft delete: cambiar status a CANCELLED
  await shipmentRepo.update(id, {
    status: 'CANCELLED',
    cancelledAt: new Date()
  });

  // Crear evento de tracking
  await trackingEventRepo.create({
    shipmentId: id,
    status: 'CANCELLED',
    description: 'Envío cancelado',
    timestamp: new Date()
  });
}
```

**Errores:**
- `401 Unauthorized`
- `404 Not Found`
- `409 Conflict`: No se puede cancelar (ya entregado)
- `500 Internal Server Error`

---

## Modelos de Datos

### TypeScript Interfaces (compartidas)

```typescript
// Address
interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Product
interface Product {
  id: string;
  name: string;
  weight: number;          // kg
  dimensions: {
    width: number;         // cm
    height: number;        // cm
    depth: number;         // cm
  };
  quantity: number;
  price: number;           // COP
}

// Shipment
interface Shipment {
  id: string;
  orderId: number;
  trackingNumber: string;
  originAddress: Address;
  destinationAddress: Address;
  products: Product[];
  transportMethod: {
    id: string;
    name: string;
  };
  status: ShipmentStatus;
  totalCost: number;
  createdAt: string;       // ISO 8601
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  cancelledAt?: string;
}

// Tracking Event
interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  description: string;
  timestamp: string;       // ISO 8601
  location?: string;
}

// Enums
enum ShipmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

enum TransportType {
  AIR = 'AIR',
  SEA = 'SEA',
  RAIL = 'RAIL',
  ROAD = 'ROAD'
}
```

### Schema de Base de Datos (Ejemplo con MongoDB)

```javascript
// shipments collection
{
  _id: ObjectId,
  id: String (UUID),
  orderId: Number,
  trackingNumber: String (unique),
  originAddress: {
    street: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  destinationAddress: { ... },
  products: [{
    id: String,
    name: String,
    weight: Number,
    dimensions: {
      width: Number,
      height: Number,
      depth: Number
    },
    quantity: Number,
    price: Number
  }],
  transportMethodId: String,
  status: String (enum),
  totalCost: Number,
  createdAt: Date,
  updatedAt: Date,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  cancelledAt: Date,

  // Indexes
  indexes: [
    { trackingNumber: 1 },
    { orderId: 1 },
    { status: 1 },
    { createdAt: -1 },
    { 'destinationAddress.city': 1 }
  ]
}

// tracking_events collection
{
  _id: ObjectId,
  id: String (UUID),
  shipmentId: String,
  status: String (enum),
  description: String,
  timestamp: Date,
  location: String,

  // Indexes
  indexes: [
    { shipmentId: 1, timestamp: -1 },
    { timestamp: -1 }
  ]
}
```

---

## Códigos de Error

### Formato de Error Estándar

```json
{
  "error": "ERROR_CODE",
  "message": "Mensaje descriptivo en español",
  "details": {
    "field": "valor_invalido"
  },
  "timestamp": "2025-11-08T14:00:00.000Z"
}
```

### Códigos HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Request exitoso |
| `201` | Created | Recurso creado |
| `204` | No Content | Eliminación exitosa |
| `400` | Bad Request | Datos inválidos |
| `401` | Unauthorized | No autenticado |
| `403` | Forbidden | Sin permisos |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (ej: tracking number duplicado) |
| `422` | Unprocessable Entity | Validación fallida |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Error del servidor |
| `503` | Service Unavailable | Servicio temporalmente no disponible |

### Ejemplos de Errores

```json
// 400 Bad Request
{
  "error": "VALIDATION_ERROR",
  "message": "Los datos proporcionados son inválidos",
  "details": {
    "transport_type": "Debe ser AIR, SEA, RAIL o ROAD"
  }
}

// 404 Not Found
{
  "error": "NOT_FOUND",
  "message": "Envío no encontrado"
}

// 409 Conflict
{
  "error": "DUPLICATE_TRACKING_NUMBER",
  "message": "El número de seguimiento ya existe"
}

// 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiadas solicitudes. Intenta nuevamente en 60 segundos",
  "retryAfter": 60
}
```

---

## Autenticación

### Headers Requeridos

```http
Authorization: Bearer <keycloak_token>
Content-Type: application/json
```

### Verificación de Token

```typescript
async function verifyToken(token: string): Promise<User> {
  try {
    // Verificar con Keycloak
    const decoded = await keycloakClient.verifyToken(token);

    return {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.realm_access.roles
    };
  } catch (error) {
    throw new UnauthorizedError('Token inválido o expirado');
  }
}
```

### Middleware de Autenticación

```typescript
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Token de autenticación requerido'
    });
  }

  try {
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Token inválido o expirado'
    });
  }
}
```

---

## Testing

### Tests Recomendados

#### Unit Tests
```typescript
describe('ReportsService', () => {
  it('should calculate KPIs correctly', async () => {
    const service = new ReportsService(mockRepo, mockCalculator);
    const kpis = await service.getKPIs('2025-01-01', '2025-12-31');

    expect(kpis.totalShipments.month).toBe(1248);
    expect(kpis.deliverySuccessRate).toBeCloseTo(87.5, 1);
  });
});
```

#### Integration Tests
```typescript
describe('GET /reports/kpis', () => {
  it('should return KPIs with valid auth', async () => {
    const response = await request(app)
      .get('/reports/kpis')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalShipments');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app).get('/reports/kpis');
    expect(response.status).toBe(401);
  });
});
```

#### E2E Tests
```typescript
describe('Shipment Tracking Flow', () => {
  it('should track shipment from creation to delivery', async () => {
    // 1. Create shipment
    const createRes = await createShipment(testData);
    const shipmentId = createRes.body.id;

    // 2. Track shipment (public)
    const trackRes = await request(app)
      .get(`/shipping/track/${shipmentId}`);

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.status).toBe('PENDING');

    // 3. Update status
    await updateShipment(shipmentId, { status: 'IN_TRANSIT' });

    // 4. Track again
    const trackRes2 = await request(app)
      .get(`/shipping/track/${shipmentId}`);

    expect(trackRes2.body.status).toBe('IN_TRANSIT');
    expect(trackRes2.body.events).toHaveLength(2);
  });
});
```

---

## Consideraciones Adicionales

### Performance

1. **Caching**: Implementar Redis para cachear KPIs (TTL: 5 minutos)
2. **Indexing**: Asegurar índices en campos frecuentemente consultados
3. **Pagination**: Siempre paginar resultados grandes
4. **Query Optimization**: Usar proyecciones para limitar campos retornados

### Seguridad

1. **Rate Limiting**:
   - Endpoints autenticados: 1000 req/min por usuario
   - Endpoint público tracking: 100 req/min por IP
2. **Input Validation**: Validar todos los inputs con schemas (Joi, Zod, etc.)
3. **SQL Injection**: Usar ORM o prepared statements
4. **CORS**: Configurar correctamente para permitir frontend
5. **Helmet**: Usar headers de seguridad

### Monitoring

1. **Logging**: Log todos los requests con nivel INFO
2. **Error Tracking**: Usar Sentry o similar
3. **Metrics**: Prometheus + Grafana para métricas
4. **Health Check**: Implementar `/health` que verifique DB, cache, etc.

### Documentación

1. **OpenAPI/Swagger**: Generar documentación interactiva
2. **Postman Collection**: Exportar colección para testing
3. **README**: Incluir instrucciones de setup y deployment

---

## Ejemplo de Implementación Completa

### Express.js + TypeScript

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { reportsRouter } from './routes/reports.routes';
import { shippingRouter } from './routes/shipping.routes';
import { errorHandler } from './middlewares/error-handler';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Routes
app.use('/reports', reportsRouter);
app.use('/shipping', shippingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;
```

```typescript
// routes/reports.routes.ts
import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ReportsController();

router.get('/kpis', authMiddleware, controller.getKPIs.bind(controller));

export { router as reportsRouter };
```

```typescript
// routes/shipping.routes.ts
import { Router } from 'express';
import { ShippingController } from '../controllers/shipping.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ShippingController();

// Public endpoint (no auth)
router.get('/track/:id', controller.trackShipment.bind(controller));

// Protected endpoints
router.get('/', authMiddleware, controller.getShipments.bind(controller));
router.get('/:id', authMiddleware, controller.getShipment.bind(controller));
router.post('/', authMiddleware, controller.createShipment.bind(controller));
router.patch('/:id', authMiddleware, controller.updateShipment.bind(controller));
router.delete('/:id', authMiddleware, controller.cancelShipment.bind(controller));

export { router as shippingRouter };
```

---

## Checklist de Implementación

### Fase 1: Setup Inicial
- [ ] Configurar proyecto (Express/Nest.js/etc)
- [ ] Configurar TypeScript
- [ ] Configurar base de datos
- [ ] Configurar autenticación con Keycloak
- [ ] Implementar middleware de error handling
- [ ] Configurar CORS

### Fase 2: Endpoints Críticos
- [ ] POST /shipping (crear envío)
- [ ] GET /shipping/:id (obtener envío)
- [ ] GET /shipping/track/:id (tracking público)
- [ ] PATCH /shipping/:id (actualizar estado)

### Fase 3: Reportes y Analytics
- [ ] GET /reports/kpis
- [ ] Implementar cálculo de métricas
- [ ] Agregar caching con Redis

### Fase 4: Features Adicionales
- [ ] GET /shipping (lista con filtros)
- [ ] DELETE /shipping/:id (cancelar)
- [ ] Implementar rate limiting
- [ ] Agregar logging y monitoring

### Fase 5: Testing y Deployment
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentación OpenAPI/Swagger
- [ ] CI/CD pipeline
- [ ] Deploy a producción

---

## Contacto y Soporte

Para dudas sobre la integración frontend-backend:
- Revisar los archivos TypeScript en `/src/app/lib/middleware/services/`
- Los DTOs están completamente tipados
- Mock data disponible para desarrollo sin backend

**Archivos importantes:**
- `shipment.service.ts` - Definiciones de DTOs
- `report.service.ts` - Interfaces de KPIs
- `mock-tracking-data.ts` - Ejemplo de datos esperados
- `mock-kpi-data.ts` - Ejemplo de estructura de KPIs
