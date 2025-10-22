# Plan de Implementación: RF-001 - Servicio de Configuración Base

> **Basado en REQUISITOS.md - RF-001**  
> **Prioridad: P0 - Crítica**  
> **Complejidad: Media**  
> **Responsable: Backend Team**  
> **Impacta: Arquitectura (5 pts) + Acceso Datos (5 pts)**

## Fase 1: Configuración de Base de Datos con Supabase MCP (20 min)

### 1.1 Crear Tablas en Supabase via MCP
**Herramienta**: MCP Supabase
**Tiempo estimado**: 15 min

**Tareas**:
- Usar MCP para crear tabla `transport_methods`
- Usar MCP para crear tabla `coverage_zones`
- Usar MCP para crear tabla `tariff_configs`
- Configurar índices y constraints via MCP
- Verificar tablas creadas correctamente

**Criterios de aceptación**:
- [ ] Tablas creadas en Supabase PostgreSQL
- [ ] Índices configurados para performance
- [ ] Constraints de unicidad establecidos
- [ ] Relaciones entre tablas definidas

### 1.2 Actualizar Schema de Prisma
**Archivo**: `backend/prisma/schema.prisma`
**Tiempo estimado**: 5 min

**Tareas**:
- Sincronizar schema.prisma con tablas creadas en Supabase
- Agregar modelos `TransportMethod`, `CoverageZone`, `TariffConfig`
- Configurar provider de PostgreSQL para Supabase
- Actualizar DATABASE_URL para Supabase

**Criterios de aceptación**:
- [ ] Schema compila sin errores
- [ ] Modelos coinciden con tablas de Supabase
- [ ] Conexión a Supabase configurada
- [ ] Tipos TypeScript disponibles

## Fase 2: Crear Módulo de Configuración (45 min)

### 2.1 Crear Estructura de Módulo
**Directorio**: `backend/src/config/`
**Tiempo estimado**: 10 min

**Tareas**:
- Crear directorio `config/`
- Crear subdirectorios: `dto/`, `entities/`, `services/`
- Crear archivo `config.module.ts`

**Estructura**:
```
backend/src/config/
├── config.module.ts
├── dto/
│   ├── create-transport-method.dto.ts
│   ├── update-transport-method.dto.ts
│   ├── create-coverage-zone.dto.ts
│   ├── update-coverage-zone.dto.ts
│   └── tariff-config.dto.ts
├── entities/
│   ├── transport-method.entity.ts
│   ├── coverage-zone.entity.ts
│   └── tariff-config.entity.ts
└── services/
    ├── config.service.ts
    ├── transport-method.service.ts
    ├── coverage-zone.service.ts
    └── tariff-config.service.ts
```

### 2.2 Crear DTOs de Validación
**Archivos**: `backend/src/config/dto/*.ts`
**Tiempo estimado**: 20 min

**Tareas**:
- Crear DTOs para crear/actualizar tipos de transporte
- Crear DTOs para crear/actualizar zonas de cobertura
- Crear DTOs para configuración de tarifas
- Agregar validaciones con class-validator

**Validaciones requeridas**:
- Códigos de transporte únicos
- Códigos postales argentinos válidos
- Tarifas positivas
- Velocidades y días estimados coherentes

### 2.3 Crear Servicios de Negocio
**Archivos**: `backend/src/config/services/*.ts`
**Tiempo estimado**: 15 min

**Tareas**:
- Implementar `TransportMethodService`
- Implementar `CoverageZoneService`
- Implementar `TariffConfigService`
- Implementar `ConfigService` principal

**Funcionalidades**:
- CRUD completo para cada entidad
- Validaciones de negocio
- Manejo de errores
- Logging de operaciones

## Fase 3: Crear Controladores REST (30 min)

### 3.1 Crear Controlador de Tipos de Transporte
**Archivo**: `backend/src/config/transport-method.controller.ts`
**Tiempo estimado**: 10 min

**Endpoints**:
- `GET /config/transport-methods`
- `POST /config/transport-methods`
- `PATCH /config/transport-methods/:id`

**Tareas**:
- Implementar endpoints REST
- Agregar validación de entrada
- Agregar manejo de errores
- Agregar documentación Swagger

### 3.2 Crear Controlador de Zonas de Cobertura
**Archivo**: `backend/src/config/coverage-zone.controller.ts`
**Tiempo estimado**: 10 min

**Endpoints**:
- `GET /config/coverage-zones`
- `POST /config/coverage-zones`
- `PATCH /config/coverage-zones/:id`

**Tareas**:
- Implementar endpoints REST
- Agregar validación de entrada
- Agregar manejo de errores
- Agregar documentación Swagger

### 3.3 Crear Controlador de Tarifas
**Archivo**: `backend/src/config/tariff.controller.ts`
**Tiempo estimado**: 10 min

**Endpoints**:
- `GET /config/tariffs`
- `PATCH /config/tariffs`

**Tareas**:
- Implementar endpoints REST
- Agregar validación de entrada
- Agregar manejo de errores
- Agregar documentación Swagger

## Fase 4: Integración con Cache Redis (20 min)

### 4.1 Implementar Cache de Configuración
**Archivo**: `backend/src/config/services/config.service.ts`
**Tiempo estimado**: 20 min

**Tareas**:
- Implementar cache Redis para tipos de transporte
- Implementar cache Redis para zonas de cobertura
- Implementar cache Redis para tarifas
- Agregar invalidación de cache en actualizaciones

**Configuración**:
- TTL: 1 hora para configuración estática
- TTL: 30 minutos para tarifas
- Invalidación automática en updates

## Fase 5: Datos Iniciales via MCP (15 min)

### 5.1 Insertar Datos Iniciales via MCP
**Herramienta**: MCP Supabase
**Tiempo estimado**: 15 min

**Tareas**:
- Usar MCP para insertar 4 tipos de transporte (air, sea, rail, road)
- Usar MCP para insertar 10 zonas de cobertura argentinas
- Usar MCP para insertar configuración de tarifas por tipo
- Verificar datos insertados correctamente

**Datos específicos**:
- 4 tipos de transporte con velocidades promedio y tarifas base
- 10 zonas de cobertura con códigos postales argentinos
- Configuración de tarifas con factor volumétrico configurable

## Fase 6: Tests Unitarios (40 min)

### 6.1 Tests de Servicios
**Archivos**: `backend/src/config/services/*.spec.ts`
**Tiempo estimado**: 25 min

**Tareas**:
- Tests para `TransportMethodService`
- Tests para `CoverageZoneService`
- Tests para `TariffConfigService`
- Tests para `ConfigService`

**Cobertura requerida**:
- Casos exitosos
- Casos de error
- Validaciones de negocio
- Integración con Prisma

### 6.2 Tests de Controladores
**Archivos**: `backend/src/config/*.controller.spec.ts`
**Tiempo estimado**: 15 min

**Tareas**:
- Tests para endpoints REST
- Tests de validación de entrada
- Tests de manejo de errores
- Tests de respuestas HTTP

## Fase 7: Documentación y Validación (20 min)

### 7.1 Actualizar Documentación OpenAPI
**Archivo**: `backend/src/config/*.controller.ts`
**Tiempo estimado**: 10 min

**Tareas**:
- Agregar decoradores Swagger
- Documentar endpoints
- Documentar DTOs
- Agregar ejemplos de requests/responses

### 7.2 Validación Final
**Tiempo estimado**: 10 min

**Tareas**:
- Verificar que todos los endpoints funcionan
- Verificar que datos iniciales se cargan
- Verificar que cache funciona
- Verificar que tests pasan

## Cronograma Total

| Fase | Descripción | Tiempo | Dependencias |
|------|-------------|--------|--------------|
| 1 | Base de Datos (Supabase MCP) | 20 min | - |
| 2 | Módulo Configuración | 45 min | Fase 1 |
| 3 | Controladores REST | 30 min | Fase 2 |
| 4 | Cache Redis | 20 min | Fase 2 |
| 5 | Datos Iniciales (Supabase MCP) | 15 min | Fase 1 |
| 6 | Tests Unitarios | 40 min | Fase 2-3 |
| 7 | Documentación | 20 min | Fase 3 |

**Tiempo total estimado**: 3 horas 10 minutos

## Criterios de Aceptación Finales

- [ ] Tablas creadas en Supabase PostgreSQL via MCP
- [ ] Datos iniciales insertados via MCP (4 tipos transporte, 10 zonas cobertura)
- [ ] Todos los endpoints REST funcionan correctamente
- [ ] Configuración se cachea en Redis con TTL apropiado
- [ ] Validaciones funcionan correctamente
- [ ] Tests unitarios cubren >60% del código (según RNF-005)
- [ ] Documentación OpenAPI está actualizada
- [ ] Performance: respuestas <200ms
- [ ] Código compila sin errores
- [ ] Linter pasa sin errores
