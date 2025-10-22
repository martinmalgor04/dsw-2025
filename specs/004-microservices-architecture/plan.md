# Plan de Implementación: RF-004 - Migración a Arquitectura de Microservicios

**Branch**: `RF-004-microservices-migration` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)  
**Input**: Análisis de estructura actual del backend monolítico modular  
**Priority**: P1 - Alta | **Complexity**: Alta | **Impact**: Arquitectura (10 pts)

## Summary

Migración del backend actual de arquitectura monolítica modular a microservicios verdaderos, manteniendo base de datos compartida para simplificar la transición. Cada módulo existente se convertirá en un servicio independiente con su propio proceso, puerto y deployment, mientras mantienen comunicación vía HTTP/REST y acceso compartido a PostgreSQL.

## Technical Context

**Language/Version**: TypeScript 5.7.3 + Node.js 18+  
**Primary Dependencies**: NestJS 11.0.1, Prisma 5.22.0, PostgreSQL 16  
**Storage**: PostgreSQL compartida (schema único, acceso multi-servicio)  
**Testing**: Jest 30.0.0 + Supertest 7.0.0  
**Target Platform**: Docker containers + desarrollo local  
**Project Type**: Microservicios con BD compartida  
**Performance Goals**: <200ms p95 por servicio, >1000 req/s agregadas  
**Constraints**: BD compartida, sin API Gateway (manejado por profesor)  
**Scale/Scope**: 3 servicios principales + shared libraries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Simplicity Gate (Article VII)
- [ ] Using ≤3 microservices iniciales? ✅ (shipping, stock-integration, config)
- [ ] No future-proofing? ✅ (sin notification-service inicial)
- [ ] Shared database simplifica comunicación? ✅

### Anti-Abstraction Gate (Article VIII) 
- [ ] Using NestJS framework directly? ✅ (sin abstracciones custom)
- [ ] Single Prisma client shared? ✅ (biblioteca compartida)

### Integration-First Gate (Article IX)
- [ ] Service contracts defined? ⏳ (Phase 1)
- [ ] HTTP client contracts written? ⏳ (Phase 1)

## Project Structure

### Documentation (this feature)

```
specs/004-microservices-architecture/
├── plan.md              # This file
├── research.md          # Phase 0: Investigación de patrones
├── migration-strategy.md # Phase 1: Estrategia detallada
├── service-contracts.md  # Phase 1: Contratos entre servicios  
├── shared-libraries.md   # Phase 1: Diseño de bibliotecas compartidas
└── tasks.md             # Phase 2: Tasks detalladas
```

### Target Architecture (post-migration)

```
backend/
├── services/
│   ├── shipping-service/
│   │   ├── src/
│   │   │   ├── main.ts              # Puerto 3001
│   │   │   ├── app.module.ts
│   │   │   ├── modules/shipping/    # Del monolito actual
│   │   │   ├── common/              # DTOs específicos
│   │   │   └── clients/             # HTTP clients a otros servicios
│   │   ├── package.json             # Dependencias independientes
│   │   ├── Dockerfile
│   │   └── tests/
│   ├── stock-integration-service/
│   │   ├── src/
│   │   │   ├── main.ts              # Puerto 3002
│   │   │   ├── app.module.ts
│   │   │   ├── stock-integration/   # Del monolito actual
│   │   │   └── clients/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── tests/
│   ├── config-service/
│   │   ├── src/
│   │   │   ├── main.ts              # Puerto 3003
│   │   │   ├── app.module.ts
│   │   │   ├── config/              # Del monolito actual
│   │   │   └── clients/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── tests/
├── shared/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Schema compartido
│   │   │   ├── migrations/          # Migraciones centralizadas
│   │   │   └── seed.ts
│   │   ├── package.json             # @logistics/database
│   │   └── src/
│   │       ├── prisma.service.ts    # Cliente Prisma compartido
│   │       └── index.ts
│   ├── types/
│   │   ├── package.json             # @logistics/types
│   │   └── src/
│   │       ├── dtos/                # DTOs comunes
│   │       ├── enums/               # Enums compartidos
│   │       └── index.ts
│   └── utils/
│       ├── package.json             # @logistics/utils
│       └── src/
│           ├── validation/          # Validadores comunes
│           ├── logging/             # Logger configurado
│           └── index.ts
├── docker-compose.yml               # Todos los servicios + PostgreSQL + Redis
├── docker-compose.dev.yml           # Override para desarrollo
└── scripts/
    ├── build-all.sh                 # Build todos los servicios
    ├── start-dev.sh                 # Desarrollo local
    └── test-all.sh                  # Tests de todos los servicios
```

**Structure Decision**: Microservicios con BD compartida usando workspace pattern. Cada servicio tiene su propio package.json pero comparte bibliotecas desde el workspace shared/. Docker Compose orquesta todos los servicios para desarrollo local.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Shared database access | Simplificar migración y transacciones | Múltiples BDs agregarian complejidad de datos distribuidos |
| HTTP communication overhead | Necesario para true microservices | Monolito no permite escalado independiente |

## Phase 0: Research & Technology Validation (45 min)

### 0.1 Investigar Patrones de Microservicios con BD Compartida
**Tool**: Web research + documentation review
**Time**: 20 min
**Deliverable**: `research.md`

**Research Questions**:
- ¿Cómo manejar transacciones distribuidas con BD compartida?
- ¿Mejores prácticas para service discovery en desarrollo local?
- ¿Estrategias de deployment independiente con Docker Compose?
- ¿Manejo de logs centralizados sin overhead?

### 0.2 Analizar Dependencias y Comunicación Actual
**Tool**: Code analysis + dependency mapping
**Time**: 15 min  
**Deliverable**: Update to `research.md`

**Analysis**:
- Mapear dependencias entre módulos actuales
- Identificar llamadas directas que necesitan HTTP clients
- Verificar compatibilidad de Prisma con múltiples servicios
- Documentar shared code que necesita biblioteca

### 0.3 Validar Herramientas de Desarrollo Local
**Tool**: Local tooling validation
**Time**: 10 min
**Deliverable**: Update to `research.md`

**Validation**:
- Docker Compose multi-service performance
- NestJS hot reload en containers
- Jest testing con multiple services
- Debugging cross-service

## Phase 1: Design & Architecture (60 min)

### 1.1 Diseñar Estrategia de Migración 
**Time**: 20 min
**Deliverable**: `migration-strategy.md`

**Strategy Components**:
- Orden de migración de servicios (config → stock → shipping)
- Backward compatibility durante transición
- Rollback plan para cada fase
- Data migration considerations

### 1.2 Definir Contratos Entre Servicios
**Time**: 25 min  
**Deliverable**: `service-contracts.md`

**Service Contracts**:
- **Config Service**: `GET /transport-methods`, `GET /coverage-zones`
- **Stock Integration Service**: `GET /products/:id`, `GET /reservas/:id`  
- **Shipping Service**: `POST /shipping/cost`, `POST /shipping`, `GET /shipping/:id`
- Error handling standards
- Authentication/authorization approach
- Health check endpoints

### 1.3 Arquitectura de Bibliotecas Compartidas
**Time**: 15 min
**Deliverable**: `shared-libraries.md`

**Shared Libraries Design**:
- `@logistics/database`: Prisma client + service setup
- `@logistics/types`: DTOs, enums, interfaces comunes
- `@logistics/utils`: Logging, validation, HTTP helpers
- Versioning strategy para shared libs
- Dependency injection patterns

## Phase 2: Implementation Planning (30 min)

### 2.1 Setup Workspace Structure
**Time**: 10 min

**Tasks**:
- Crear estructura de carpetas para services/ y shared/
- Configurar workspace en package.json raíz  
- Setup Docker Compose con servicios + dependencias

### 2.2 Create Shared Libraries First  
**Time**: 15 min

**Tasks**:
- Implementar @logistics/database con Prisma setup
- Crear @logistics/types con DTOs actuales
- Desarrollar @logistics/utils con logger y validación
- Configurar build pipeline para shared libs

### 2.3 Migrate Services Sequentially
**Time**: 5 min planning

**Migration Order**:
1. **Config Service** (menos dependencias)
2. **Stock Integration Service** (intermedio)  
3. **Shipping Service** (más dependencias, último)

**For Each Service**:
- Crear estructura independiente
- Mover código del monolito
- Implementar HTTP clients
- Configurar tests independientes
- Dockerizar y validar

## Success Criteria

### Technical Validation
- [ ] Cada servicio corre independientemente en su puerto
- [ ] Comunicación HTTP entre servicios funciona
- [ ] Shared libraries importan correctamente
- [ ] Tests pasan para cada servicio
- [ ] Docker Compose levanta todo el stack

### Performance Validation  
- [ ] Response times <200ms p95 per service
- [ ] Memory usage <512MB per service container
- [ ] Startup time <30s para todo el stack
- [ ] Hot reload funciona en desarrollo

### Development Experience
- [ ] `npm run dev` levanta todos los servicios
- [ ] Debugging cross-service funciona
- [ ] Logs centralizados y legibles
- [ ] Tests pueden correrse independientemente

## Risks & Mitigations

### High Risk
- **Database connection pooling**: Múltiples servicios + Prisma  
  *Mitigation*: Configurar pools separados por servicio
- **Transaction handling**: Operaciones cross-service  
  *Mitigation*: Identificar y documentar transacciones distribuidas

### Medium Risk  
- **Development complexity**: Multiple processes  
  *Mitigation*: Scripts automation + Docker Compose
- **Debugging difficulty**: Cross-service calls  
  *Mitigation*: Structured logging + correlation IDs

### Low Risk
- **Network latency**: HTTP vs in-process  
  *Mitigation*: Local development, latencia mínima

## Next Steps

1. **Execute Phase 0**: Research & validation → `research.md`
2. **Execute Phase 1**: Design & architecture → detailed design docs  
3. **Run `/speckit.tasks`**: Generate detailed task breakdown
4. **Execute `/speckit.implement`**: Begin migration implementation

**Note**: Este plan mantiene la flexibilidad para ajustes basados en findings de la fase de research, especialmente around performance y development tooling.