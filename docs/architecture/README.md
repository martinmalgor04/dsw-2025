# 🏗️ Arquitectura del Sistema - Visión General

## Descripción

El sistema de logística está diseñado como un **monorepo** con **arquitectura de microservicios**, separando claramente las responsabilidades entre backend, frontend y documentación.

**Última actualización**: 6 de Noviembre de 2025

---

## Estructura del Monorepo

```
dsw-2025/
├── backend/
│   ├── services/              # 4 microservicios independientes
│   │   ├── config-service/    # Port 3003
│   │   ├── shipping-service/  # Port 3001
│   │   ├── stock-integration-service/  # Port 3002
│   │   └── operator-interface-service/ # Port 3004 (Gateway)
│   ├── shared/                # Bibliotecas compartidas
│   │   ├── database/          # @logistics/database (Prisma)
│   │   ├── types/             # @logistics/types
│   │   └── utils/             # @logistics/utils
│   └── docs/                  # Documentación técnica del backend
├── frontend/                  # Aplicación Next.js (Port 3005)
├── docs/                      # Documentación del proyecto
└── .github/workflows/         # CI/CD
```

---

## Microservicios Backend

### 1. **Config Service** (Port 3003)
- **Responsabilidad**: Configuración y gestión de flota
- **Módulos**: Transport methods, coverage zones, tariff configs, vehicles, drivers, routes
- **Base de datos**: PostgreSQL (Prisma)

### 2. **Shipping Service** (Port 3001)
- **Responsabilidad**: Operaciones de envío y cotización
- **Características**: Cálculo de costos, peso volumétrico, seguimiento
- **Integraciones**: Config Service, Stock Integration Service

### 3. **Stock Integration Service** (Port 3002)
- **Responsabilidad**: Cliente HTTP para API externa de Stock
- **Características**: Circuit breaker, retry policy, Redis cache
- **Patrón**: Resilient HTTP client

### 4. **Operator Interface Service** (Port 3004)
- **Responsabilidad**: API Gateway para el frontend
- **Patrón**: Smart Proxy / Facade
- **Características**: Service registry, request ID tracking, health aggregation

---

## Componentes Principales

### Frontend (Next.js)
- **Port**: 3005
- **Framework**: Next.js + React
- **Estado**: React Context/Hooks
- **API Client**: Fetch/Axios to Operator Interface (Gateway)

### Shared Libraries (NPM Workspaces)
- **@logistics/database**: Esquema Prisma, PrismaService
- **@logistics/types**: DTOs, enums, interfaces
- **@logistics/utils**: Utilidades compartidas

---

## Comunicación

```
Frontend (3005)
     ↓
Operator Interface Gateway (3004)
     ↓
  ┌──┴──┬──────┬───────┐
  ↓     ↓      ↓       ↓
Config Shipping Stock External
(3003) (3001)  (3002) Stock API
```

- **Frontend ↔ Gateway**: HTTP REST
- **Gateway ↔ Services**: HTTP proxy routing
- **Services ↔ Database**: Prisma ORM (PostgreSQL)
- **Services ↔ External**: HTTP clients (with resilience patterns)

---

## Patrones de Diseño

- **API Gateway**: Operator Interface Service
- **Circuit Breaker**: Stock Integration Service
- **Service Layer**: Lógica de negocio en services
- **Repository Pattern**: Prisma como capa de datos
- **DTO Pattern**: Validación con class-validator
- **Dependency Injection**: NestJS IoC container

---

## Seguridad

### Desarrollo
- CORS configurado
- Validación de input (DTOs)
- Sin autenticación (endpoints abiertos al 06/11/2025)

### Producción (Roadmap)
- **Autenticación**: Keycloak + JWT
- **Autorización**: RBAC (Role-Based Access Control)
- **Rate Limiting**: Por IP y por usuario
- **HTTPS**: Obligatorio

---

## Escalabilidad

- **Horizontal**: Cada microservicio es independiente y escalable
- **Vertical**: Cache (Redis para Stock, in-memory para Shipping)
- **Database**: Connection pooling, índices optimizados
- **API Gateway**: Load balancing (futuro)

---

## Documentación Detallada

Para documentación técnica completa del backend, ver:

**📖 [Backend Architecture Documentation](../backend/docs/architecture/README.md)**

Esta documentación incluye:
- Detalles de cada microservicio
- Flujos de request completos
- Configuración de servicios
- Estándares de código
- Testing y observabilidad
- Roadmap arquitectónico

---

## Enlaces Útiles

- **[API Documentation](../backend/docs/api/README.md)** - Endpoints y contratos
- **[Database Schema](../backend/docs/database/README.md)** - Prisma schema y migraciones
