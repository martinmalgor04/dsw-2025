# 🏗️ Arquitectura del Sistema

## Visión General

El sistema de logística está diseñado como un monorepo con arquitectura de microservicios, separando claramente las responsabilidades entre backend, frontend y middleware.

## Estructura del Monorepo

```
logisticaG12/
├── backend/                    # Microservicio NestJS
├── frontend/                   # Aplicación SvelteKit + Middleware
├── docs/                       # Documentación técnica
└── .github/workflows/          # CI/CD
```

## Componentes Principales

### Backend (NestJS)
- **Módulos**: shipping, config, vehicles, routes, integrations
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Cache**: Redis
- **API**: REST con OpenAPI/Swagger

### Frontend (SvelteKit)
- **Páginas**: dashboard, shipments, config, track
- **Componentes**: UI reutilizables
- **Estado**: Svelte stores

### Middleware
- **Servicios**: API calls al backend
- **Mappers**: Transformadores DTO ↔ UI
- **Validadores**: Validaciones cliente
- **Utils**: Utilidades (polling, format, etc)

## Patrones de Diseño

- **Repository Pattern**: Prisma como capa de acceso a datos
- **Service Layer**: Lógica de negocio en servicios
- **DTO Pattern**: Transferencia de datos tipada
- **Dependency Injection**: NestJS IoC container

## Comunicación

- **Frontend ↔ Backend**: HTTP REST API
- **Backend ↔ Database**: Prisma ORM
- **Backend ↔ External APIs**: HTTP clients
- **Real-time**: Polling (futuro: WebSockets)

## Seguridad

- **Validación**: class-validator en DTOs
- **Sanitización**: Input sanitization
- **Logs**: Auditoría de operaciones
- **CORS**: Configurado para desarrollo

## Escalabilidad

- **Horizontal**: Microservicios independientes
- **Vertical**: Cache Redis para performance
- **Database**: Índices optimizados
- **API**: Paginación y filtros

---

**Última actualización**: 16 de Octubre de 2025
