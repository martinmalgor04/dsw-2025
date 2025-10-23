# 📋 Especificaciones del Proyecto - LogiX

Bienvenido al sistema de especificaciones de **LogiX - Sistema de Gestión Logística**. Este directorio contiene la documentación completa de todos los Requisitos Funcionales (RF) del proyecto.

---

## 📁 Estructura de Especificaciones

Cada RF tiene su propia carpeta con tres documentos:
- **spec.md** - Especificación técnica detallada
- **plan.md** - Plan de implementación y fases
- **tasks.md** - Desglose detallado de tareas

---

## 🎯 Requisitos Funcionales (RFs)

### ✅ Backend - RFs Completados

#### **RF-001: Servicio de Configuración Base**
- **Estado**: ✅ Completado
- **Descripción**: Gestión de métodos de transporte y zonas de cobertura
- **Carpeta**: No tiene (ya completado)
- **Documentación**: [Backend Docs](../backend/docs/README.md)

#### **RF-002: Integración con Stock**
- **Estado**: ✅ Completado
- **Descripción**: Integración con API externa de Stock para productos y reservas
- **Carpeta**: No tiene (ya completado)
- **Documentación**: [Backend Docs](../backend/docs/README.md)

#### **RF-003: Servicio de Cotización**
- **Estado**: ✅ Completado
- **Descripción**: Cálculo de costos de envío basado en productos, distancia y tarifas
- **Carpeta**: No tiene (ya completado)
- **Documentación**: [Backend Docs](../backend/docs/README.md)

#### **RF-004: Esquema de Base de Datos con Prisma**
- **Estado**: ✅ Completado
- **Descripción**: Diseño e implementación del schema Prisma con vehículos, conductores y rutas
- **Carpeta**: `005-database-schema/`
- **Archivos**:
  - [spec.md](005-database-schema/spec.md) - Especificación técnica
  - [plan.md](005-database-schema/plan.md) - Plan de implementación
  - [tasks.md](005-database-schema/tasks.md) - Desglose de tareas

---

### 🚀 Frontend - RFs en Progreso

#### **RF-007: Servicios HTTP (API Client Layer)**
- **Estado**: 🚀 En Diseño
- **Prioridad**: P0 - CRÍTICO
- **Estimación**: 40 horas
- **Descripción**: Capa de servicios que encapsula todas las llamadas HTTP al backend
- **Carpeta**: `006-http-services/`
- **Archivos**:
  - [spec.md](006-http-services/spec.md) - Especificación técnica
  - [plan.md](006-http-services/plan.md) - Plan de implementación (7 fases)
  - [tasks.md](006-http-services/tasks.md) - 24 tareas detalladas

**Componentes Principales:**
- ✅ HttpClient base con configuración centralizada
- ✅ 7 Domain Services (Config, Shipment, Vehicle, Driver, Route, Report, Health)
- ✅ Error handling unificado
- ✅ Retry logic con exponential backoff
- ✅ Request/Response interceptors
- ✅ JWT injection automática
- ✅ Logging centralizado

**Criterios de Aceptación:** 15 criterios
**Team:** 3 personas (Middleware)

---

#### **RF-008: Stores de Estado Global (Svelte Stores)**
- **Estado**: 🚀 En Diseño
- **Prioridad**: P1 - IMPORTANTE
- **Estimación**: 20 horas
- **Descripción**: Sistema de estado global para compartir datos entre componentes
- **Carpeta**: `007-state-management/`
- **Archivos**:
  - [spec.md](007-state-management/spec.md) - Especificación técnica

**Stores Incluidos:**
- ✅ AuthStore - Autenticación con JWT
- ✅ ShipmentsStore - Envíos con filtros y paginación
- ✅ ConfigStore - Configuración (métodos y zonas)
- ✅ VehiclesStore - Vehículos
- ✅ DriversStore - Conductores
- ✅ UIStore - UI Global (modales, notificaciones)

**Características:**
- ✅ Persistencia en localStorage
- ✅ Auto-refresh de tokens
- ✅ Derived stores
- ✅ Custom hooks (useAuth, useShipments, etc)
- ✅ Sincronización automática

**Criterios de Aceptación:** 14 criterios
**Team:** 2 personas (Middleware)

---

#### **RF-009: Validadores y Transformadores**
- **Estado**: 🚀 En Diseño
- **Prioridad**: P1 - IMPORTANTE
- **Estimación**: 15 horas
- **Descripción**: Schemas de validación y mappers bidireccionales para transformación de datos
- **Carpeta**: `008-validators-mappers/`
- **Archivos**:
  - [spec.md](008-validators-mappers/spec.md) - Especificación técnica

**Componentes Principales:**
- ✅ Schemas Zod (Shipment, Vehicle, Driver, Address, etc)
- ✅ Validaciones customizadas (CP argentino, teléfono, patente, DNI)
- ✅ Mappers DTO → ViewModel
- ✅ Mappers FormData → DTO
- ✅ Formatters (fecha, moneda, teléfono, estados)
- ✅ Mensajes de error en español
- ✅ Hook useFormValidation

**Criterios de Aceptación:** 12 criterios
**Team:** 1 persona (Middleware)

---

## 📊 Resumen de Estimaciones

| RF | Nombre | Prioridad | Horas | Team | Status |
|---|--------|-----------|-------|------|--------|
| RF-001 | Config Base | P0 | - | Backend | ✅ |
| RF-002 | Stock Integration | P0 | - | Backend | ✅ |
| RF-003 | Cotización | P0 | - | Backend | ✅ |
| RF-004 | DB Schema | P1 | - | Backend | ✅ |
| **RF-007** | **HTTP Services** | **P0** | **40h** | **3** | **🚀** |
| **RF-008** | **State Management** | **P1** | **20h** | **2** | **🚀** |
| **RF-009** | **Validators** | **P1** | **15h** | **1** | **🚀** |
| **TOTAL MIDDLEWARE** | | | **75h** | **~5** | |

---

## 🔄 Dependencias entre RFs

```
Backend (Completado)
├── RF-001: Config Base ✅
├── RF-002: Stock Integration ✅
├── RF-003: Cotización ✅
└── RF-004: DB Schema ✅

Frontend (En Progreso)
└── Middleware Layer 🚀
    ├── RF-007: HTTP Services (40h)
    │   └── Consume Backend APIs
    ├── RF-008: State Management (20h)
    │   └── Consume RF-007 Services
    └── RF-009: Validators & Mappers (15h)
        └── Validar entrada y mapear datos

Consumidores (UI Components)
└── Consumen RF-008 + RF-009
    └── Interactúan vía RF-007
```

---

## 📋 Cómo Usar las Especificaciones

### 1. **Para Entender un RF**
Comienza leyendo el **spec.md**:
- Información general y objetivo
- Arquitectura y componentes
- Criterios de aceptación
- Métricas de éxito

### 2. **Para Planificar Implementación**
Lee el **plan.md**:
- Fases de implementación
- Timeline recomendado
- Asignación de team
- Dependencias entre fases

### 3. **Para Ejecutar**
Consulta el **tasks.md**:
- 24+ tareas detalladas
- Estimación por tarea
- Dependencias
- Checklist de aceptación

---

## 🚀 Timeline de Implementación

### Semana 1-2: RF-007 (HTTP Services) - FASE 1-3
- Setup TypeScript
- HTTP Client + Error Handling
- Config Service
- **Output**: Base HTTP client + ConfigService funcionales

### Semana 2-3: RF-007 (HTTP Services) - FASE 4-6
- Shipment Service
- Vehicle, Driver, Route Services
- Reports & Health
- **Output**: Todos servicios HTTP funcionales

### Semana 3-4: RF-007 + RF-008 (Testing & State Management)
- Tests de integración E2E
- Documentación RF-007
- Implementación RF-008 (AuthStore)
- **Output**: RF-007 completo + AuthStore

### Semana 4-5: RF-008 (State Management)
- Shipments, Config, UI Stores
- Custom hooks
- **Output**: RF-008 completo

### Semana 5: RF-009 (Validators & Mappers)
- Schemas Zod
- Mappers bidireccionales
- Formatters
- **Output**: RF-009 completo

---

## 📚 Documentación Relacionada

- **Backend Documentation**: [Backend Docs](../backend/docs/README.md)
- **Backend API Endpoints**: [API Endpoints Internos](../frontend/src/lib/middleware/API-ENDPOINTS-INTERNOS.md)
- **Requisitos del Proyecto**: [REQUISITOS.md](../REQUISITOS.md)
- **README Principal**: [README Principal](../README.md)

---

## ✅ Checklist de Specs

- [x] RF-007: Servicios HTTP - Spec completo
- [x] RF-007: Servicios HTTP - Plan completido
- [x] RF-007: Servicios HTTP - Tasks completadas
- [x] RF-008: State Management - Spec completado
- [x] RF-009: Validators & Mappers - Spec completado
- [ ] RF-007: Implementación (En progreso)
- [ ] RF-008: Implementación (Pendiente)
- [ ] RF-009: Implementación (Pendiente)

---

## 🤝 Contribución

Al contribuir a este proyecto:
1. Mantén los specs actualizados
2. Agrega cambios a la carpeta `/specs`
3. Actualiza este README si hay cambios estructurales
4. Sigue la estructura: `spec.md` + `plan.md` + `tasks.md`

---

## 📞 Contacto

Para preguntas sobre las especificaciones:
- Review de **spec.md** para detalles técnicos
- Revise **plan.md** para timeline
- Consulte **tasks.md** para tareas específicas

---

**Última actualización**: Octubre 22, 2025  
**Estado del Proyecto**: Frontend - Middleware Layer en Diseño  
**Próximo Hito**: Iniciar implementación RF-007
