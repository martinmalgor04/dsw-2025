# Config Service - API Endpoints

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Coverage Zones](#coverage-zones)
- [Tariff Configs](#tariff-configs)
- [Transport Methods](#transport-methods)
- [Drivers (Fleet)](#drivers-fleet)
- [Vehicles (Fleet)](#vehicles-fleet)
- [Routes (Fleet)](#routes-fleet)
- [Health Check](#health-check)

---

## Información General

**Base URL**: `http://localhost:3003`
**API Gateway**: `http://localhost:3004/config`
**Swagger UI**: `http://localhost:3003/api/docs`

### Autenticación
Actualmente no requiere autenticación. Para producción se recomienda implementar JWT o API Keys.

### Formato de Respuesta
Todas las respuestas son en formato JSON con estructura estándar:

```json
{
  "id": "uuid",
  "...campos específicos...",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp"
}
```

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Eliminación exitosa |
| 400 | Bad Request - Datos inválidos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: duplicado) |
| 500 | Internal Server Error - Error del servidor |

---

## Coverage Zones

### POST `/config/coverage-zones`

Crea una nueva zona de cobertura.

**Request Body:**
```json
{
  "name": "Zona Centro",
  "description": "Área central de cobertura",
  "postalCodes": ["1000", "1001", "1002"],
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Zona Centro",
  "description": "Área central de cobertura",
  "postalCodes": ["1000", "1001", "1002"],
  "isActive": true,
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Errores:**
- `400`: Datos inválidos (name requerido, postalCodes debe ser array)
- `409`: Ya existe una zona con ese nombre

---

### GET `/config/coverage-zones`

Lista todas las zonas de cobertura ordenadas por fecha de creación (descendente).

**Query Parameters:** Ninguno

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Zona Centro",
    "description": "Área central de cobertura",
    "postalCodes": ["1000", "1001", "1002"],
    "isActive": true,
    "createdAt": "2024-11-06T10:00:00.000Z",
    "updatedAt": "2024-11-06T10:00:00.000Z"
  }
]
```

---

### GET `/config/coverage-zones/:id`

Obtiene una zona de cobertura específica por ID.

**Path Parameters:**
- `id` (UUID) - Identificador de la zona

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Zona Centro",
  "postalCodes": ["1000", "1001", "1002"],
  "isActive": true,
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Errores:**
- `400`: ID inválido (debe ser UUID)
- `404`: Zona no encontrada

---

### PATCH `/config/coverage-zones/:id`

Actualiza una zona de cobertura existente.

**Path Parameters:**
- `id` (UUID) - Identificador de la zona

**Request Body (todos los campos opcionales):**
```json
{
  "name": "Zona Centro Actualizada",
  "description": "Nueva descripción",
  "postalCodes": ["1000", "1001", "1002", "1003"],
  "isActive": false
}
```

**Response (200):** Zona actualizada

**Errores:**
- `400`: Datos inválidos
- `404`: Zona no encontrada

---

### DELETE `/config/coverage-zones/:id`

Desactiva una zona de cobertura (soft delete - setea `isActive` a `false`).

**Path Parameters:**
- `id` (UUID) - Identificador de la zona

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "isActive": false
}
```

**Errores:**
- `404`: Zona no encontrada

---

## Tariff Configs

### POST `/config/tariff-configs`

Crea una nueva configuración de tarifa asociada a un método de transporte.

**Request Body:**
```json
{
  "transportMethodId": "123e4567-e89b-12d3-a456-426614174000",
  "baseTariff": 50.0,
  "costPerKg": 2.5,
  "costPerKm": 1.2,
  "minWeight": 0,
  "maxWeight": 100,
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "transportMethodId": "123e4567-e89b-12d3-a456-426614174000",
  "baseTariff": "50.00",
  "costPerKg": "2.50",
  "costPerKm": "1.20",
  "minWeight": 0,
  "maxWeight": 100,
  "isActive": true,
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Notas:**
- Los valores decimales (baseTariff, costPerKg, costPerKm) se devuelven como strings por precisión de Prisma Decimal
- `transportMethodId` debe ser un UUID válido de un método de transporte existente

**Errores:**
- `400`: Datos inválidos (costos negativos, transportMethodId inválido)
- `404`: Método de transporte no encontrado

---

### GET `/config/tariff-configs`

Lista todas las configuraciones de tarifas con filtro opcional por método de transporte.

**Query Parameters:**
- `transportMethodId` (opcional, UUID) - Filtra por método de transporte

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "transportMethodId": "123e4567-e89b-12d3-a456-426614174000",
    "baseTariff": "50.00",
    "costPerKg": "2.50",
    "costPerKm": "1.20",
    "isActive": true,
    "transportMethod": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "code": "ground",
      "name": "Terrestre"
    },
    "createdAt": "2024-11-06T10:00:00.000Z",
    "updatedAt": "2024-11-06T10:00:00.000Z"
  }
]
```

**Ejemplos:**
- `GET /config/tariff-configs` - Todas las tarifas
- `GET /config/tariff-configs?transportMethodId=123e4567-e89b-12d3-a456-426614174000` - Solo tarifas del método especificado

---

### GET `/config/tariff-configs/:id`

Obtiene una configuración de tarifa específica por ID.

**Path Parameters:**
- `id` (UUID) - Identificador de la tarifa

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "transportMethodId": "123e4567-e89b-12d3-a456-426614174000",
  "baseTariff": "50.00",
  "costPerKg": "2.50",
  "costPerKm": "1.20",
  "transportMethod": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "ground",
    "name": "Terrestre"
  },
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Errores:**
- `400`: ID inválido
- `404`: Tarifa no encontrada

---

### PATCH `/config/tariff-configs/:id`

Actualiza una configuración de tarifa existente.

**Path Parameters:**
- `id` (UUID) - Identificador de la tarifa

**Request Body (todos los campos opcionales):**
```json
{
  "baseTariff": 60.0,
  "costPerKg": 3.0,
  "isActive": false
}
```

**Response (200):** Tarifa actualizada

**Errores:**
- `400`: Datos inválidos (costos negativos)
- `404`: Tarifa no encontrada

---

### DELETE `/config/tariff-configs/:id`

Desactiva una configuración de tarifa (soft delete).

**Path Parameters:**
- `id` (UUID) - Identificador de la tarifa

**Response (200):** Tarifa desactivada

**Errores:**
- `404`: Tarifa no encontrada

---

## Transport Methods

### POST `/config/transport-methods`

Crea un nuevo método de transporte.

**Request Body:**
```json
{
  "code": "air",
  "name": "Aéreo",
  "description": "Transporte aéreo para envíos urgentes",
  "averageSpeed": 800,
  "estimatedDays": "1-2",
  "baseCostPerKm": 1.5,
  "baseCostPerKg": 5.0,
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "code": "air",
  "name": "Aéreo",
  "description": "Transporte aéreo para envíos urgentes",
  "averageSpeed": 800,
  "estimatedDays": "1-2",
  "baseCostPerKm": "1.50",
  "baseCostPerKg": "5.00",
  "isActive": true,
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Validaciones:**
- `code`: 2-20 caracteres, único
- `name`: 2-100 caracteres
- `averageSpeed`: >= 1
- `baseCostPerKm`, `baseCostPerKg`: >= 0

**Errores:**
- `400`: Datos inválidos
- `409`: Ya existe un método con ese código

---

### GET `/config/transport-methods`

Lista todos los métodos de transporte con sus tarifas asociadas.

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "air",
    "name": "Aéreo",
    "averageSpeed": 800,
    "estimatedDays": "1-2",
    "baseCostPerKm": "1.50",
    "baseCostPerKg": "5.00",
    "isActive": true,
    "tariffConfigs": [
      {
        "id": "tariff-1",
        "baseTariff": "100.00",
        "costPerKg": "5.00"
      }
    ],
    "createdAt": "2024-11-06T10:00:00.000Z",
    "updatedAt": "2024-11-06T10:00:00.000Z"
  }
]
```

---

### GET `/config/transport-methods/:id`

Obtiene un método de transporte específico por ID.

**Path Parameters:**
- `id` (UUID) - Identificador del método

**Response (200):** Método de transporte con tariffConfigs incluidas

**Errores:**
- `400`: ID inválido
- `404`: Método no encontrado

---

### PATCH `/config/transport-methods/:id`

Actualiza un método de transporte existente.

**Request Body (todos los campos opcionales):**
```json
{
  "name": "Aéreo Express",
  "averageSpeed": 850,
  "isActive": false
}
```

**Response (200):** Método actualizado

**Errores:**
- `400`: Datos inválidos
- `404`: Método no encontrado

---

### DELETE `/config/transport-methods/:id`

Desactiva un método de transporte (soft delete).

**Response (200):** Método desactivado

---

## Drivers (Fleet)

### POST `/fleet/drivers`

Crea un nuevo conductor.

**Request Body:**
```json
{
  "employeeId": "DRV-001",
  "firstName": "Juan",
  "lastName": "Pérez",
  "licenseNumber": "LIC-12345",
  "licenseType": "A",
  "licenseExpiry": "2025-12-31T00:00:00Z",
  "phone": "+54911234567",
  "email": "juan.perez@company.com",
  "status": "ACTIVE"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "employeeId": "DRV-001",
  "firstName": "Juan",
  "lastName": "Pérez",
  "licenseNumber": "LIC-12345",
  "licenseType": "A",
  "licenseExpiry": "2025-12-31T00:00:00.000Z",
  "phone": "+54911234567",
  "email": "juan.perez@company.com",
  "status": "ACTIVE",
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Validaciones:**
- `employeeId`: Único, requerido
- `licenseNumber`: Único, requerido
- `email`: Formato válido
- `status`: Enum (ACTIVE, ON_LEAVE, INACTIVE)

**Errores:**
- `400`: Datos inválidos
- `409`: Ya existe conductor con ese employeeId o licenseNumber

---

### GET `/fleet/drivers`

Lista todos los conductores.

**Response (200):** Array de conductores

---

### GET `/fleet/drivers/:id`

Obtiene un conductor específico por ID.

**Response (200):** Conductor

**Errores:**
- `400`: ID inválido
- `404`: Conductor no encontrado

---

### PATCH `/fleet/drivers/:id`

Actualiza un conductor existente.

**Response (200):** Conductor actualizado

---

### DELETE `/fleet/drivers/:id`

Elimina un conductor (hard delete).

**Response (200):** Conductor eliminado

---

## Vehicles (Fleet)

### POST `/fleet/vehicles`

Crea un nuevo vehículo.

**Request Body:**
```json
{
  "licensePlate": "ABC-123",
  "brand": "Mercedes-Benz",
  "model": "Sprinter",
  "year": 2023,
  "capacity": 3500,
  "volume": 15.5,
  "fuelType": "DIESEL",
  "status": "AVAILABLE"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "licensePlate": "ABC-123",
  "brand": "Mercedes-Benz",
  "model": "Sprinter",
  "year": 2023,
  "capacity": 3500,
  "volume": "15.50",
  "fuelType": "DIESEL",
  "status": "AVAILABLE",
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Validaciones:**
- `licensePlate`: Único, requerido
- `capacity`: >= 0
- `fuelType`: Enum (GASOLINE, DIESEL, ELECTRIC, HYBRID)
- `status`: Enum (AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE)

---

### GET `/fleet/vehicles`

Lista todos los vehículos.

---

### GET `/fleet/vehicles/:id`

Obtiene un vehículo específico por ID.

---

### PATCH `/fleet/vehicles/:id`

Actualiza un vehículo existente.

---

### DELETE `/fleet/vehicles/:id`

Elimina un vehículo (hard delete).

---

## Routes (Fleet)

### POST `/fleet/routes`

Crea una nueva ruta de distribución.

**Request Body:**
```json
{
  "name": "Ruta Centro - Zona Norte",
  "description": "Distribución diaria zona norte",
  "startDate": "2024-12-01T08:00:00Z",
  "endDate": "2024-12-01T18:00:00Z",
  "status": "PLANNED",
  "transportMethodId": "123e4567-e89b-12d3-a456-426614174000",
  "vehicleId": "123e4567-e89b-12d3-a456-426614174001",
  "driverId": "123e4567-e89b-12d3-a456-426614174002",
  "coverageZoneId": "123e4567-e89b-12d3-a456-426614174003"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174099",
  "name": "Ruta Centro - Zona Norte",
  "status": "PLANNED",
  "transportMethodId": "...",
  "vehicleId": "...",
  "driverId": "...",
  "coverageZoneId": "...",
  "createdAt": "2024-11-06T10:00:00.000Z",
  "updatedAt": "2024-11-06T10:00:00.000Z"
}
```

**Validaciones:**
- `name`: Requerido
- `transportMethodId`: UUID válido de método existente
- `status`: Enum (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)

---

### GET `/fleet/routes`

Lista todas las rutas con sus relaciones (transportMethod, vehicle, driver, coverageZone).

**Response (200):**
```json
[
  {
    "id": "route-1",
    "name": "Ruta Centro",
    "status": "IN_PROGRESS",
    "transportMethod": { "code": "ground", "name": "Terrestre" },
    "vehicle": { "licensePlate": "ABC-123" },
    "driver": { "firstName": "Juan", "lastName": "Pérez" },
    "coverageZone": { "name": "Zona Norte" }
  }
]
```

---

### GET `/fleet/routes/:id`

Obtiene una ruta específica por ID con todas sus relaciones incluyendo stops.

**Response (200):** Ruta completa con stops array

---

### PATCH `/fleet/routes/:id`

Actualiza una ruta existente (cambio de estado, reasignación de vehículo/conductor).

---

### DELETE `/fleet/routes/:id`

Elimina una ruta (hard delete). Solo se pueden eliminar rutas en estado PLANNED o CANCELLED.

**Errores:**
- `400`: No se puede eliminar ruta IN_PROGRESS o COMPLETED

---

## Health Check

### GET `/health`

Verifica el estado del servicio y sus dependencias.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-11-06T10:00:00.000Z",
  "service": "config-service",
  "database": {
    "status": "up"
  }
}
```

**Códigos de estado:**
- `200`: Servicio saludable
- `503`: Servicio no disponible (base de datos inaccesible)

---

### GET `/`

Endpoint raíz que devuelve información del servicio.

**Response (200):**
```json
{
  "service": "config-service",
  "version": "1.0.0"
}
```

---

## Notas de Implementación

### Soft Delete vs Hard Delete
- **Soft Delete**: Coverage Zones, Tariff Configs, Transport Methods (setean `isActive` a `false`)
- **Hard Delete**: Drivers, Vehicles, Routes (eliminan físicamente el registro)

### Relaciones
- `TariffConfig` → `TransportMethod` (N:1)
- `Route` → `TransportMethod`, `Vehicle`, `Driver`, `CoverageZone` (N:1 cada una)
- `Route` → `RouteStop` (1:N)

### Ordenamiento
Todas las listas se devuelven ordenadas por `createdAt` descendente (más recientes primero).

### Testing
Todos los endpoints tienen tests E2E completos en `/test/e2e/`:
- `coverage-zones.e2e-spec.ts`
- `tariff-configs.e2e-spec.ts`
- `transport-methods.e2e-spec.ts`
- `drivers.e2e-spec.ts`
- `vehicles.e2e-spec.ts`
- `routes.e2e-spec.ts`
- `health.e2e-spec.ts`

Ejecutar tests: `npm run test:e2e`

---

**Última actualización**: 2024-11-06
**Versión del servicio**: 1.0.0
**Mantenido por**: Grupo 12 - UTN FRRE
