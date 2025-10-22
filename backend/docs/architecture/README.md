||# 🏗️ Arquitectura del Backend

## Visión general

El backend está construido con NestJS, organizado por módulos de dominio y capas bien definidas (controllers → services → infraestructura). Actualmente funciona como un monolito modular listo para evolucionar a microservicios. La documentación de la futura división está en `backend/README-MICROSERVICES.md`.

## Módulos principales

- `src/config`:
  - Gestión de métodos de transporte y zonas de cobertura.
  - Publica endpoints internos (para frontend) y externos (OpenAPI `openapilog.yaml`).
- `src/modules/shipping`:
  - Lógica de cálculo de costos y creación de envíos.
  - Integra datos de productos y reservas (RF-002).
- `src/stock-integration`:
  - Cliente HTTP a API de Stock externa.
  - Incluye cache, circuit breaker, reintentos y fallback.
- `src/prisma`:
  - Conexión a PostgreSQL (Supabase) mediante Prisma ORM.
  - Esquema, cliente y servicio `PrismaService`.
- `src/common`:
  - DTOs reutilizables, enums, utilidades.

## Capas

- Controladores (HTTP): validación (DTOs), mapeo de rutas, códigos de estado.
- Servicios (dominio): reglas de negocio, orquestación, manejo de errores.
- Infraestructura: Prisma (DB), HttpModule (APIs externas), Cache (in-memory/Redis).

## Flujo de request

1. Cliente → Controller (`/api/...`).
2. Controller valida DTOs y llama al Service.
3. Service usa Prisma/HTTP/Cache según corresponda.
4. Respuesta tipada y consistente (formato JSON estándar).

## Estándares

- DTOs con class-validator/class-transformer.
- Mapeo snake_case ↔ camelCase en Prisma con `@map("column_name")`.
- Errors tipificados (Prisma P10xx/P20xx) y mensajes claros.
- Logs estructurados (Nest Logger); interceptores de logging en integración con Stock.

## Seguridad

- Desarrollo: endpoints abiertos.
- Producción (plan): Keycloak + JWT, scopes por recurso, guards en Nest (`nest-keycloak-connect`).

## Observabilidad (plan)

- Métricas Prometheus/Grafana.
- Tracing distribuido (Jaeger).
- Health checks por módulo (`/health`).

## Evolución a microservicios

La guía de separación por servicios (`config-service`, `shipping-service`, `stock-integration-service`, `operator-interface`) está detallada en `backend/README-MICROSERVICES.md`. Cada servicio tendrá su `main.ts`, `package.json`, `Dockerfile`, puerto y pipeline propios.

## Referencias

- APIs: `backend/docs/api/README.md`.
- Base de datos: `backend/docs/database/README.md`.
- Despliegue: `backend/docs/deployment/README.md`.

