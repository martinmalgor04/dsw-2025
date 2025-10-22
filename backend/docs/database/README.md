# Database Architecture - Sistema de Logística

## 📋 Descripción General

Base de datos PostgreSQL (Supabase) que implementa un sistema completo de gestión de logística con soporte para envíos, vehículos, conductores, rutas y configuración de tarifas.

**Tecnología**: PostgreSQL 17 + Prisma ORM  
**Hosting**: Supabase  
**Schema**: `public`

---

## 🏗️ Arquitectura

### **Capas de la Aplicación**

```
Microservicios (config, stock, shipping, operator)
        ↓
Shared Database Library (backend/shared/database)
        ↓
Prisma ORM
        ↓
PostgreSQL (Supabase)
```

### **Conexiones**

- **DATABASE_URL**: Pooling connection (aplicaciones)
- **DIRECT_URL**: Direct connection (migraciones)

---

## 📊 Modelos de Datos

### **Entidades Principales**

#### **1. TransportMethod** (Métodos de Transporte)
Tipos de transporte disponibles en el sistema.

```typescript
TransportMethod {
  id: UUID
  code: VARCHAR (UNIQUE) // "air", "sea", "rail", "road"
  name: VARCHAR
  averageSpeed: INT (km/h)
  estimatedDays: VARCHAR // "1-3", "3-7"
  baseCostPerKm: DECIMAL
  baseCostPerKg: DECIMAL
  isActive: BOOLEAN
}
```

**Uso**: Cotización de envíos, cálculo de costos base.

---

#### **2. CoverageZone** (Zonas de Cobertura)
Zonas geográficas cubiertas por la empresa.

```typescript
CoverageZone {
  id: UUID
  name: VARCHAR
  description: TEXT
  postalCodes: TEXT[] // Códigos postales argentinos
  isActive: BOOLEAN
}
```

**Uso**: Validación de entrega, filtrado de disponibilidad.

---

#### **3. TariffConfig** (Configuración de Tarifas)
Tarifas específicas por método de transporte.

```typescript
TariffConfig {
  id: UUID
  transportMethodId: FK → TransportMethod
  baseTariff: DECIMAL
  costPerKg: DECIMAL
  costPerKm: DECIMAL
  volumetricFactor: INT
  environment: VARCHAR // "development", "testing", "production"
  isActive: BOOLEAN
  validFrom: TIMESTAMPTZ
  validTo: TIMESTAMPTZ
}
```

**Uso**: Cálculo de costos de envío basado en fecha, ambiente y método.

---

#### **4. Shipment** (Envíos)
Envíos principales del sistema.

```typescript
Shipment {
  id: UUID
  orderId: INT
  userId: INT
  trackingNumber: VARCHAR (UNIQUE)
  status: ENUM // CREATED, RESERVED, IN_TRANSIT, DELIVERED, CANCELLED
  transportType: ENUM
  deliveryAddress: JSON
  totalCost: DECIMAL
  estimatedDeliveryAt: TIMESTAMPTZ
}
```

**Relaciones**:
- N:1 con TransportMethod
- N:1 con CoverageZone
- N:1 con Route (asignación de ruta)
- 1:N con ShipmentProduct
- 1:N con ShipmentLog

---

#### **5. ShipmentProduct** (Productos por Envío)
Productos incluidos en cada envío.

```typescript
ShipmentProduct {
  id: UUID
  shippingId: FK → Shipment
  productId: INT // ID del Stock
  quantity: INT
  weight: FLOAT
  volume: FLOAT
}
```

---

#### **6. ShipmentLog** (Historial de Estados)
Auditoría de cambios de estado de envíos.

```typescript
ShipmentLog {
  id: UUID
  shippingId: FK → Shipment
  status: ENUM
  message: VARCHAR
  timestamp: TIMESTAMPTZ
  userId: VARCHAR
}
```

---

#### **7. Vehicle** (Vehículos) - NEW
Gestión de flota de vehículos.

```typescript
Vehicle {
  id: UUID
  licensePlate: VARCHAR (UNIQUE)
  make: VARCHAR
  model: VARCHAR
  year: INT
  capacityKg: INT
  volumeM3: DECIMAL
  fuelType: VARCHAR
  status: VARCHAR // "AVAILABLE", "IN_USE", "MAINTENANCE"
  transportMethodId: FK → TransportMethod
  driverId: FK → Driver (nullable)
}
```

**Relaciones**:
- N:1 con TransportMethod
- N:1 con Driver (opcional)
- 1:N con Route

---

#### **8. Driver** (Conductores) - NEW
Gestión de conductores.

```typescript
Driver {
  id: UUID
  employeeId: VARCHAR (UNIQUE)
  firstName: VARCHAR
  lastName: VARCHAR
  email: VARCHAR (UNIQUE)
  phone: VARCHAR
  licenseNumber: VARCHAR (UNIQUE)
  licenseType: VARCHAR // "A", "B", "C", "D", "E"
  status: VARCHAR // "ACTIVE", "INACTIVE", "SUSPENDED"
}
```

**Relaciones**:
- 1:N con Vehicle
- 1:N con Route

---

#### **9. Route** (Rutas) - NEW
Sistema de rutas de distribución.

```typescript
Route {
  id: UUID
  name: VARCHAR
  description: TEXT
  status: VARCHAR // "PLANNED", "IN_PROGRESS", "COMPLETED"
  startDate: TIMESTAMPTZ
  endDate: TIMESTAMPTZ
  transportMethodId: FK → TransportMethod
  vehicleId: FK → Vehicle (nullable)
  driverId: FK → Driver (nullable)
  coverageZoneId: FK → CoverageZone (nullable)
}
```

**Relaciones**:
- N:1 con TransportMethod, Vehicle, Driver, CoverageZone
- 1:N con RouteStop
- 1:N con Shipment (asignación de envíos)

---

#### **10. RouteStop** (Paradas de Ruta) - NEW
Paradas individuales en cada ruta.

```typescript
RouteStop {
  id: UUID
  routeId: FK → Route (CASCADE DELETE)
  sequence: INT
  type: VARCHAR // "PICKUP", "DELIVERY", "TRANSIT", "FUEL", "REST"
  address: JSONB // {street, city, state, postalCode, country}
  coordinates: JSONB // {lat, lng}
  scheduledTime: TIMESTAMPTZ
  actualTime: TIMESTAMPTZ
  status: VARCHAR // "PENDING", "IN_PROGRESS", "COMPLETED"
}
```

---

## 🔗 Relaciones de Base de Datos

### **Relaciones 1:N (Uno a Muchos)**

```
TransportMethod (1) → (N) Shipment, Vehicle, Route, TariffConfig
CoverageZone (1) → (N) Shipment, Route
Shipment (1) → (N) ShipmentProduct, ShipmentLog, Route (asignación)
Vehicle (1) → (N) Route
Driver (1) → (N) Vehicle, Route
Route (1) → (N) RouteStop
```

### **Relaciones 1:1 (Uno a Uno)**

```
Vehicle (1) ↔ (1) Driver (opcional)
```

### **Cascading**

- `RouteStop.route_id` → `Route.id` (CASCADE DELETE)
  - Si se elimina una ruta, se eliminan automáticamente sus paradas

---

## 📈 Índices de Rendimiento

**Total**: 16 índices para optimización de queries frecuentes

```
drivers:
  - employee_id (búsqueda por ID)
  - email (búsqueda y login)
  - status (filtrado por disponibilidad)

vehicles:
  - license_plate (búsqueda por placa)
  - status (filtrado por disponibilidad)
  - transport_method_id (relación)
  - driver_id (relación)

routes:
  - status (filtrado por estado)
  - start_date (búsquedas por fecha)
  - transport_method_id (relación)
  - vehicle_id (relación)
  - driver_id (relación)
  - coverage_zone_id (relación)

route_stops:
  - route_id (búsqueda por ruta)
  - sequence (ordenamiento)
  - status (filtrado por estado)
```

---

## 🔐 Integridad de Datos

### **Constraints**

- **UNIQUE**: licensePlate, employeeId, email, licenseNumber, code
- **NOT NULL**: Campos requeridos validados
- **Foreign Keys**: Todas las relaciones protegidas
- **Check Constraints**: Enums y estados válidos

### **Cascade Rules**

- RouteStop: CASCADE DELETE (eliminar ruta elimina paradas)
- Shipment, Vehicle, Route: SET NULL (mantienen historial)

---

## 🛠️ Operaciones Comunes

### **Obtener Rutas Activas con Detalles**

```sql
SELECT 
  r.name,
  r.status,
  d.first_name || ' ' || d.last_name as driver,
  v.license_plate,
  COUNT(rs.id) as stop_count
FROM routes r
LEFT JOIN drivers d ON r.driver_id = d.id
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN route_stops rs ON r.id = rs.route_id
WHERE r.status IN ('PLANNED', 'IN_PROGRESS')
GROUP BY r.id, r.name, d.first_name, d.last_name, v.license_plate;
```

### **Paradas de una Ruta Ordenadas**

```sql
SELECT 
  sequence,
  type,
  address->>'city' as city,
  coordinates->>'lat' as latitude,
  scheduled_time
FROM route_stops
WHERE route_id = $1
ORDER BY sequence ASC;
```

### **Conductores Disponibles**

```sql
SELECT 
  d.id,
  d.first_name || ' ' || d.last_name as name,
  COUNT(v.id) as vehicle_count
FROM drivers d
LEFT JOIN vehicles v ON d.id = v.driver_id
WHERE d.status = 'ACTIVE'
GROUP BY d.id, d.first_name, d.last_name;
```

---

## 🚀 Acceso desde Microservicios

### **Conexión con Prisma**

```typescript
// En backend/shared/database/src
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Uso
const routes = await prisma.route.findMany({
  where: { status: 'IN_PROGRESS' },
  include: {
    vehicle: true,
    driver: true,
    stops: { orderBy: { sequence: 'asc' } }
  }
});
```

### **Variables de Entorno**

```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
```

---

## 📊 Estadísticas Actuales

| Métrica | Valor |
|---------|-------|
| Tablas | 10 |
| Modelos | 10 |
| Relaciones FK | 7 |
| Índices | 16 |
| Registros Seed | 12 (3 drivers, 3 vehicles, 3 routes, 3 stops) |
| Tamaño DB | ~300 KB |

---

## 📚 Documentación Completa

- **Prisma Schema**: `prisma/schema.prisma`
- **Seed Script**: `prisma/seed.ts`
- **Migrations**: `prisma/migrations/`
- **Tests**: `__tests__/schema.integration.spec.ts`
- **Automation Scripts**: `scripts/`

---

## 🔧 Requisitos

- PostgreSQL 12+
- Prisma 5.0+
- Node.js 18+
- TypeScript

---

## ✨ Características

✅ Relaciones complejas (1:N, 1:1, N:M)  
✅ Cascade delete para integridad  
✅ JSONB para datos semiestructurados  
✅ 16 índices para optimización  
✅ Timestamps de auditoría  
✅ Soft deletes con isActive  
✅ Supports Prisma ORM  

---

**Última Actualización**: Octubre 22, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
