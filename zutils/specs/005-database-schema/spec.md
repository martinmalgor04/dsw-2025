# RF-004: Esquema de Base de Datos con Prisma

## 📋 Información General

- **ID**: RF-004
- **Título**: Esquema de Base de Datos con Prisma
- **Prioridad**: P0 (CRÍTICO)
- **Complejidad**: Media
- **Responsable**: Backend Team
- **Estimación**: 40 horas (5 días)
- **Dependencias**: RF-001, RF-002, RF-003

## 🎯 Objetivo

Diseñar e implementar un esquema de base de datos completo con Prisma ORM que soporte toda la funcionalidad de la plataforma de logística, incluyendo gestión de envíos, vehículos, conductores, rutas y seguimiento en tiempo real.

## 📊 Contexto y Justificación

### **Estado Actual de la Base de Datos**
- **Supabase PostgreSQL** ya configurado y funcionando
- **Tablas existentes** implementadas en RF-001, RF-002, RF-003
- **MCP de Supabase** disponible para consultar esquema actual
- **Necesidad de unificación** del modelo de datos

### **Análisis Previo Requerido**
- ✅ **Consultar tablas existentes** via MCP de Supabase
- ✅ **Revisar relaciones actuales** entre entidades
- ✅ **Identificar duplicaciones** o inconsistencias
- ✅ **Mapear dependencias** con microservicios existentes

### **Problema Actual**
- Esquema fragmentado entre microservicios
- Posibles inconsistencias en relaciones
- Falta trazabilidad completa de envíos
- No hay gestión de vehículos y conductores
- Ausencia de sistema de rutas optimizadas

### **Solución Propuesta**
- **Análisis del esquema actual** via MCP de Supabase
- **Diseño unificado** basado en estado actual
- **Migración gradual** sin pérdida de datos
- **Modelo de datos completo** con todas las entidades necesarias
- **Sistema de auditoría** y trazabilidad
- **Optimización de consultas** con índices apropiados

## 🔍 Análisis del Esquema Actual

### **Paso 1: Consulta de Tablas Existentes**
Antes de diseñar el nuevo esquema, es **CRÍTICO** consultar el estado actual:

```bash
# Usar MCP de Supabase para consultar tablas existentes
# Revisar qué tablas ya están implementadas
# Identificar relaciones actuales
# Mapear campos y tipos de datos existentes
```

### **Tablas a Consultar via MCP:**
- **TransportMethod** (RF-001)
- **CoverageZone** (RF-001) 
- **TariffConfig** (RF-001)
- **Productos** (RF-002)
- **Reservas** (RF-002)
- **Cualquier otra tabla** creada en microservicios

### **Información Crítica a Obtener:**
1. **Estructura actual** de cada tabla
2. **Relaciones existentes** entre tablas
3. **Constraints y validaciones** ya implementadas
4. **Índices actuales** y su rendimiento
5. **Datos de prueba** existentes
6. **Migraciones aplicadas** previamente

### **Decisiones de Diseño Basadas en Análisis:**
- ✅ **Reutilizar** tablas bien diseñadas
- ✅ **Migrar** tablas con problemas
- ✅ **Unificar** tablas duplicadas
- ✅ **Agregar** tablas faltantes
- ✅ **Optimizar** relaciones existentes

## 🏗️ Arquitectura del Esquema

### **Entidades Principales**

#### **1. TransportMethod (Métodos de Transporte)**
```prisma
model TransportMethod {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?
  type        TransportType
  averageSpeed Float
  estimatedDays String
  baseCostPerKm Float
  baseCostPerKg Float
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  shipments   Shipment[]
  vehicles    Vehicle[]
  routes      Route[]
  tariffConfigs TariffConfig[]
}
```

#### **2. CoverageZone (Zonas de Cobertura)**
```prisma
model CoverageZone {
  id          String   @id @default(cuid())
  name        String
  description String?
  postalCodes String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  shipments   Shipment[]
  routes      Route[]
}
```

#### **3. Shipment (Envíos)**
```prisma
model Shipment {
  id              String        @id @default(cuid())
  trackingNumber  String        @unique
  orderId         String
  userId          String
  status          ShipmentStatus @default(PENDING)
  priority        Priority      @default(NORMAL)
  
  // Direcciones
  originAddress   Json
  destinationAddress Json
  
  // Información de envío
  weight          Float
  volume         Float
  declaredValue   Float?
  insuranceValue Float?
  
  // Fechas
  scheduledDate   DateTime?
  pickupDate     DateTime?
  deliveryDate   DateTime?
  estimatedDelivery DateTime?
  
  // Relaciones
  transportMethodId String
  transportMethod   TransportMethod @relation(fields: [transportMethodId], references: [id])
  coverageZoneId    String
  coverageZone      CoverageZone @relation(fields: [coverageZoneId], references: [id])
  
  // Relaciones 1:N
  products      ShipmentProduct[]
  logs          ShipmentLog[]
  routeStops    RouteStop[]
  
  // Metadatos
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Índices
  @@index([trackingNumber])
  @@index([orderId])
  @@index([userId])
  @@index([status])
  @@index([transportMethodId])
}
```

#### **4. ShipmentProduct (Productos por Envío)**
```prisma
model ShipmentProduct {
  id          String   @id @default(cuid())
  shipmentId  String
  productId   String
  quantity    Int
  weight      Float
  volume      Float
  price       Float?
  
  // Relaciones
  shipment    Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  
  // Metadatos
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Índices
  @@index([shipmentId])
  @@index([productId])
  @@unique([shipmentId, productId])
}
```

#### **5. ShipmentLog (Historial de Estados)**
```prisma
model ShipmentLog {
  id          String   @id @default(cuid())
  shipmentId  String
  status      ShipmentStatus
  description String?
  location    Json?    // {lat, lng, address}
  timestamp   DateTime @default(now())
  userId      String?  // Usuario que realizó el cambio
  
  // Relaciones
  shipment    Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  
  // Índices
  @@index([shipmentId])
  @@index([status])
  @@index([timestamp])
}
```

#### **6. Vehicle (Vehículos)**
```prisma
model Vehicle {
  id              String   @id @default(cuid())
  licensePlate    String   @unique
  make            String
  model           String
  year            Int
  capacity        Float    // Capacidad en kg
  volume          Float    // Volumen en m³
  fuelType        FuelType
  status          VehicleStatus @default(AVAILABLE)
  
  // Relaciones
  transportMethodId String
  transportMethod   TransportMethod @relation(fields: [transportMethodId], references: [id])
  driverId          String?
  driver            Driver? @relation(fields: [driverId], references: [id])
  
  // Relaciones 1:N
  routes        Route[]
  
  // Metadatos
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Índices
  @@index([licensePlate])
  @@index([status])
  @@index([transportMethodId])
}
```

#### **7. Driver (Conductores)**
```prisma
model Driver {
  id              String   @id @default(cuid())
  employeeId      String   @unique
  firstName       String
  lastName        String
  email           String   @unique
  phone           String
  licenseNumber   String   @unique
  licenseType     LicenseType
  status          DriverStatus @default(ACTIVE)
  
  // Relaciones 1:N
  vehicles        Vehicle[]
  routes          Route[]
  
  // Metadatos
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Índices
  @@index([employeeId])
  @@index([email])
  @@index([status])
}
```

#### **8. Route (Rutas)**
```prisma
model Route {
  id              String   @id @default(cuid())
  name            String
  description     String?
  status          RouteStatus @default(PLANNED)
  startDate       DateTime
  endDate         DateTime?
  
  // Relaciones
  transportMethodId String
  transportMethod   TransportMethod @relation(fields: [transportMethodId], references: [id])
  vehicleId        String?
  vehicle          Vehicle? @relation(fields: [vehicleId], references: [id])
  driverId         String?
  driver           Driver? @relation(fields: [driverId], references: [id])
  coverageZoneId   String?
  coverageZone     CoverageZone? @relation(fields: [coverageZoneId], references: [id])
  
  // Relaciones 1:N
  stops           RouteStop[]
  shipments       Shipment[]
  
  // Metadatos
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Índices
  @@index([status])
  @@index([startDate])
  @@index([transportMethodId])
}
```

#### **9. RouteStop (Paradas de Ruta)**
```prisma
model RouteStop {
  id          String   @id @default(cuid())
  routeId     String
  sequence    Int
  type        StopType
  address     Json     // {street, city, state, postalCode, country}
  coordinates Json?    // {lat, lng}
  scheduledTime DateTime?
  actualTime  DateTime?
  status      StopStatus @default(PENDING)
  
  // Relaciones
  route       Route @relation(fields: [routeId], references: [id], onDelete: Cascade)
  
  // Metadatos
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Índices
  @@index([routeId])
  @@index([sequence])
  @@index([status])
}
```

#### **10. TariffConfig (Configuración de Tarifas)**
```prisma
model TariffConfig {
  id                String   @id @default(cuid())
  transportMethodId String
  name              String
  description       String?
  baseTariff        Float
  costPerKg         Float
  costPerKm         Float
  volumetricFactor  Float    @default(5000) // Factor volumétrico estándar
  isActive          Boolean  @default(true)
  
  // Relaciones
  transportMethod   TransportMethod @relation(fields: [transportMethodId], references: [id])
  
  // Metadatos
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Índices
  @@index([transportMethodId])
  @@index([isActive])
}
```

### **Enums Definidos**

```prisma
enum TransportType {
  ROAD
  RAIL
  AIR
  SEA
  MULTIMODAL
}

enum ShipmentStatus {
  PENDING
  CONFIRMED
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  RETURNED
  EXCEPTION
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum VehicleStatus {
  AVAILABLE
  IN_USE
  MAINTENANCE
  OUT_OF_SERVICE
}

enum FuelType {
  GASOLINE
  DIESEL
  ELECTRIC
  HYBRID
  LPG
  CNG
}

enum LicenseType {
  A
  B
  C
  D
  E
}

enum DriverStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  ON_LEAVE
}

enum RouteStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum StopType {
  PICKUP
  DELIVERY
  TRANSIT
  FUEL
  REST
}

enum StopStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
  CANCELLED
}
```

## 🔗 Relaciones del Esquema

### **Relaciones 1:N (Uno a Muchos)**
- `TransportMethod` → `Shipment[]`
- `TransportMethod` → `Vehicle[]`
- `TransportMethod` → `Route[]`
- `TransportMethod` → `TariffConfig[]`
- `CoverageZone` → `Shipment[]`
- `CoverageZone` → `Route[]`
- `Shipment` → `ShipmentProduct[]`
- `Shipment` → `ShipmentLog[]`
- `Vehicle` → `Route[]`
- `Driver` → `Vehicle[]`
- `Driver` → `Route[]`
- `Route` → `RouteStop[]`

### **Relaciones N:M (Muchos a Muchos)**
- `Shipment` ↔ `Route` (a través de `RouteStop`)

### **Relaciones 1:1 (Uno a Uno)**
- `Vehicle` ↔ `Driver` (opcional)

## 📊 Índices y Optimizaciones

### **Índices Primarios**
- Todos los modelos tienen `id` como clave primaria
- Campos `@unique` tienen índices automáticos

### **Índices de Búsqueda Frecuente**
- `Shipment.trackingNumber` - Búsqueda por número de seguimiento
- `Shipment.orderId` - Búsqueda por ID de orden
- `Shipment.userId` - Búsqueda por usuario
- `Shipment.status` - Filtrado por estado
- `Vehicle.licensePlate` - Búsqueda por placa
- `Driver.employeeId` - Búsqueda por ID de empleado
- `Driver.email` - Búsqueda por email

### **Índices Compuestos**
- `[shipmentId, productId]` en `ShipmentProduct`
- `[routeId, sequence]` en `RouteStop`

## 🔒 Constraints y Validaciones

### **Constraints de Unicidad**
- `TransportMethod.code` - Código único
- `Shipment.trackingNumber` - Número de seguimiento único
- `Vehicle.licensePlate` - Placa única
- `Driver.employeeId` - ID de empleado único
- `Driver.email` - Email único
- `Driver.licenseNumber` - Número de licencia único

### **Validaciones de Datos**
- Campos requeridos marcados con `@id` o sin `?`
- Tipos de datos específicos para cada campo
- Enums para valores predefinidos
- Constraints de integridad referencial

## 🚀 Migraciones y Seed

### **Migraciones**
- Generación automática con `prisma migrate dev`
- Migraciones incrementales para cambios
- Rollback automático en caso de error
- Documentación de cada migración

### **Script de Seed**
- Datos iniciales para `TransportMethod`
- Zonas de cobertura básicas
- Configuraciones de tarifas
- Usuarios de prueba
- Vehículos y conductores de ejemplo

## 🧪 Testing del Esquema

### **Tests de Integridad**
- Validación de relaciones
- Constraints de unicidad
- Validaciones de datos
- Índices de rendimiento

### **Tests de Migración**
- Aplicación de migraciones
- Rollback de migraciones
- Validación de esquema
- Datos de seed

## 📈 Métricas y Monitoreo

### **Métricas de Rendimiento**
- Tiempo de consulta por tabla
- Uso de índices
- Tamaño de base de datos
- Crecimiento de datos

### **Monitoreo de Salud**
- Conexiones activas
- Consultas lentas
- Errores de base de datos
- Espacio en disco

## 🔐 Seguridad

### **Acceso a Datos**
- Autenticación requerida para todas las operaciones
- Autorización basada en roles
- Auditoría de cambios
- Encriptación de datos sensibles

### **Protección de Datos**
- Backup automático
- Recuperación ante desastres
- Retención de datos
- Cumplimiento GDPR

## 🎯 Criterios de Aceptación

### **Funcionales**
- ✅ Schema Prisma con todos los modelos definidos
- ✅ Relaciones bien definidas (1:N, N:M)
- ✅ Enums para estados y tipos
- ✅ Índices en campos de búsqueda frecuente
- ✅ Constraints de unicidad y validación
- ✅ Migraciones generadas y documentadas
- ✅ Script de seed con datos iniciales

### **No Funcionales**
- ✅ Rendimiento optimizado para consultas frecuentes
- ✅ Escalabilidad horizontal
- ✅ Disponibilidad 99.9%
- ✅ Seguridad de datos
- ✅ Auditoría completa

## 📋 Dependencias

### **Técnicas**
- Prisma ORM
- PostgreSQL
- Node.js 18+
- TypeScript

### **Funcionales**
- RF-001: Servicio de Configuración Base
- RF-002: Integración con Stock
- RF-003: Servicio de Cotización

## 🚨 Riesgos y Mitigaciones

### **Riesgos Identificados**
1. **Migración de datos existentes**
   - Mitigación: Scripts de migración graduales
2. **Rendimiento con grandes volúmenes**
   - Mitigación: Índices optimizados y particionado
3. **Integridad de datos**
   - Mitigación: Constraints y validaciones robustas

### **Plan de Contingencia**
- Rollback automático en caso de error
- Backup antes de migraciones
- Monitoreo en tiempo real
- Alertas automáticas

## 📚 Documentación Adicional

### **Documentos de Referencia**
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)

### **Herramientas Recomendadas**
- Prisma Studio para visualización
- pgAdmin para administración
- Database monitoring tools
- Backup automation tools

---

**Este esquema proporciona la base sólida para toda la funcionalidad de la plataforma de logística, asegurando escalabilidad, rendimiento y mantenibilidad a largo plazo.**

