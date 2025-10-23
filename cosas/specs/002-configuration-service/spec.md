# Especificación: RF-001 - Servicio de Configuración Base

## Resumen
Implementar un módulo para gestionar toda la configuración operativa de la plataforma (tipos de transporte, zonas de cobertura, tarifas) según los requisitos funcionales RF-001 definidos en REQUISITOS.md.

## Objetivos
- Configuración mediante variables de entorno por ambiente
- Almacenamiento de configuración en base de datos PostgreSQL (Supabase)
- Gestión de tipos de transporte con velocidades promedio y tarifas base
- Gestión de zonas de cobertura con códigos postales argentinos
- Factor volumétrico configurable
- Endpoints REST para consultar y modificar configuración
- Seed data inicial con 4 tipos de transporte y 10 zonas de Argentina

## Criterios de Aceptación (RF-001)

### CA001: Configuración por Ambiente
- [ ] Configuración mediante variables de entorno por ambiente
- [ ] Almacenamiento de configuración en base de datos PostgreSQL (Supabase)
- [ ] Gestión de tipos de transporte con velocidades promedio y tarifas base
- [ ] Gestión de zonas de cobertura con códigos postales argentinos
- [ ] Factor volumétrico configurable
- [ ] Endpoints REST para consultar y modificar configuración
- [ ] Seed data inicial con 4 tipos de transporte y 10 zonas de Argentina

### CA002: Endpoints Específicos (según REQUISITOS.md)
- [ ] `GET /config/transport-methods` → Lista métodos de transporte
- [ ] `POST /config/transport-methods` → Crea nuevo método
- [ ] `PATCH /config/transport-methods/{id}` → Actualiza método
- [ ] `GET /config/coverage-zones` → Lista zonas de cobertura
- [ ] `POST /config/coverage-zones` → Crea nueva zona

### CA003: Impacto en Puntaje
- [ ] Arquitectura (5 pts): Separación de responsabilidades, patrones, diseño
- [ ] Acceso Datos (5 pts): BD + Prisma ORM + migraciones

## Requisitos Técnicos

### Backend (NestJS)
- Nuevo módulo `config` en `backend/src/config/`
- Servicio de configuración con inyección de dependencias
- DTOs para validación de entrada y salida
- Base de datos: PostgreSQL en Supabase con tablas `transport_methods`, `coverage_zones`, `tariff_configs`
- Cache Redis para configuración frecuentemente consultada
- Migraciones de Prisma para esquema de base de datos
- Integración con Supabase PostgreSQL via MCP

### Endpoints REST (Exactos según REQUISITOS.md)
```
GET /config/transport-methods
  → Lista métodos de transporte
  ← Array de tipos de transporte con velocidades y tarifas base

POST /config/transport-methods
  → Crea nuevo método de transporte
  ← Método de transporte creado con ID

PATCH /config/transport-methods/{id}
  → Actualiza método de transporte existente
  ← Método de transporte actualizado

GET /config/coverage-zones
  → Lista zonas de cobertura
  ← Array de zonas con códigos postales argentinos

POST /config/coverage-zones
  → Crea nueva zona de cobertura
  ← Zona de cobertura creada con ID
```

### Modelos de Datos (Según RF-001)
```typescript
// TransportMethod - Gestión de tipos de transporte con velocidades promedio y tarifas base
interface TransportMethod {
  id: string;
  code: string; // 'air', 'sea', 'rail', 'road' (4 tipos según seed data)
  name: string;
  description?: string;
  averageSpeed: number; // km/h - velocidad promedio
  estimatedDays: string; // "1-3", "3-7", etc.
  baseCostPerKm: number; // tarifa base por km
  baseCostPerKg: number; // tarifa base por kg
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// CoverageZone - Gestión de zonas de cobertura con códigos postales argentinos
interface CoverageZone {
  id: string;
  name: string;
  description?: string;
  postalCodes: string[]; // Array de códigos postales argentinos (10 zonas según seed data)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// TariffConfig - Factor volumétrico configurable
interface TariffConfig {
  id: string;
  transportMethodId: string;
  baseTariff: number;
  costPerKg: number;
  costPerKm: number;
  volumetricFactor: number; // Factor volumétrico configurable
  environment: string; // 'development', 'testing', 'production' - configuración por ambiente
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Consideraciones de Implementación

### Base de Datos
- Usar Prisma ORM para modelos y migraciones
- Base de datos PostgreSQL en Supabase (acceso via MCP)
- Índices en campos de búsqueda frecuente (code, postalCodes)
- Constraints de unicidad en códigos de transporte
- Soft delete para mantener historial

### Performance
- Cache de configuración en Redis con TTL de 1 hora
- Invalidación de cache al actualizar configuración
- Lazy loading de configuración no crítica

### Validaciones
- Códigos de transporte únicos y predefinidos (air, sea, rail, road)
- Códigos postales argentinos válidos (formato: H3500ABC)
- Tarifas positivas y dentro de rangos razonables
- Fechas de vigencia de tarifas coherentes
- Velocidades promedio realistas por tipo de transporte

### Seguridad
- Validación de entrada con class-validator
- Sanitización de datos de entrada
- Logs de auditoría para cambios de configuración
- Permisos de administrador para modificar configuración

## Datos Iniciales (Seed)

### Tipos de Transporte
```typescript
const initialTransportMethods = [
  {
    code: 'air',
    name: 'Aéreo',
    description: 'Transporte aéreo para envíos urgentes',
    averageSpeed: 800,
    estimatedDays: '1-3',
    baseCostPerKm: 0.8,
    baseCostPerKg: 5.0,
    isActive: true
  },
  {
    code: 'road',
    name: 'Terrestre',
    description: 'Transporte por carretera',
    averageSpeed: 80,
    estimatedDays: '3-7',
    baseCostPerKm: 0.3,
    baseCostPerKg: 2.0,
    isActive: true
  },
  {
    code: 'rail',
    name: 'Ferroviario',
    description: 'Transporte por ferrocarril',
    averageSpeed: 60,
    estimatedDays: '5-10',
    baseCostPerKm: 0.2,
    baseCostPerKg: 1.5,
    isActive: true
  },
  {
    code: 'sea',
    name: 'Marítimo',
    description: 'Transporte marítimo para envíos internacionales',
    averageSpeed: 30,
    estimatedDays: '15-30',
    baseCostPerKm: 0.1,
    baseCostPerKg: 1.0,
    isActive: true
  }
];
```

### Zonas de Cobertura (Argentina)
```typescript
const initialCoverageZones = [
  {
    name: 'Buenos Aires Capital',
    postalCodes: ['C1000', 'C1001', 'C1002', 'C1003', 'C1004', 'C1005'],
    isActive: true
  },
  {
    name: 'Gran Buenos Aires',
    postalCodes: ['B1600', 'B1601', 'B1602', 'B1603', 'B1604', 'B1605'],
    isActive: true
  },
  {
    name: 'Córdoba Capital',
    postalCodes: ['X5000', 'X5001', 'X5002', 'X5003', 'X5004', 'X5005'],
    isActive: true
  },
  {
    name: 'Rosario',
    postalCodes: ['S2000', 'S2001', 'S2002', 'S2003', 'S2004', 'S2005'],
    isActive: true
  },
  {
    name: 'Mendoza Capital',
    postalCodes: ['M5500', 'M5501', 'M5502', 'M5503', 'M5504', 'M5505'],
    isActive: true
  },
  {
    name: 'Tucumán Capital',
    postalCodes: ['T4000', 'T4001', 'T4002', 'T4003', 'T4004', 'T4005'],
    isActive: true
  },
  {
    name: 'La Plata',
    postalCodes: ['B1900', 'B1901', 'B1902', 'B1903', 'B1904', 'B1905'],
    isActive: true
  },
  {
    name: 'Mar del Plata',
    postalCodes: ['B7600', 'B7601', 'B7602', 'B7603', 'B7604', 'B7605'],
    isActive: true
  },
  {
    name: 'Salta Capital',
    postalCodes: ['A4400', 'A4401', 'A4402', 'A4403', 'A4404', 'A4405'],
    isActive: true
  },
  {
    name: 'Santa Fe Capital',
    postalCodes: ['S3000', 'S3001', 'S3002', 'S3003', 'S3004', 'S3005'],
    isActive: true
  }
];
```

### Configuración de Tarifas
```typescript
const initialTariffConfigs = [
  {
    transportMethodCode: 'air',
    baseTariff: 100.0,
    costPerKg: 8.0,
    costPerKm: 1.2,
    volumetricFactor: 200,
    environment: 'development'
  },
  {
    transportMethodCode: 'road',
    baseTariff: 50.0,
    costPerKg: 3.0,
    costPerKm: 0.5,
    volumetricFactor: 300,
    environment: 'development'
  },
  {
    transportMethodCode: 'rail',
    baseTariff: 30.0,
    costPerKg: 2.0,
    costPerKm: 0.3,
    volumetricFactor: 400,
    environment: 'development'
  },
  {
    transportMethodCode: 'sea',
    baseTariff: 20.0,
    costPerKg: 1.5,
    costPerKm: 0.2,
    volumetricFactor: 500,
    environment: 'development'
  }
];
```

## Dependencias
- Módulo Prisma existente
- Servicio Redis existente
- Sistema de validación con class-validator
- Sistema de logging existente
- Acceso a Supabase PostgreSQL via MCP

## Criterios de Éxito (RF-001)
- [ ] Configuración mediante variables de entorno por ambiente ✅
- [ ] Almacenamiento de configuración en base de datos PostgreSQL (Supabase) ✅
- [ ] Gestión de tipos de transporte con velocidades promedio y tarifas base ✅
- [ ] Gestión de zonas de cobertura con códigos postales argentinos ✅
- [ ] Factor volumétrico configurable ✅
- [ ] Endpoints REST para consultar y modificar configuración ✅
- [ ] Seed data inicial con 4 tipos de transporte y 10 zonas de Argentina ✅
- [ ] Todos los endpoints funcionan correctamente
- [ ] Configuración se cachea en Redis
- [ ] Validaciones funcionan correctamente
- [ ] Tests unitarios cubren >60% del código (según RNF-005)
- [ ] Documentación OpenAPI actualizada
- [ ] Performance: respuestas <200ms
