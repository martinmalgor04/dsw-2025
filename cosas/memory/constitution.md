# Constitución del Proyecto - Módulo de Logística

## Principios Fundamentales

### 1. Arquitectura y Tecnologías
- **Backend**: NestJS con TypeScript
- **Frontend**: SvelteKit con Tailwind CSS
- **Base de datos**: PostgreSQL con Prisma ORM
- **Cache**: Redis para optimización de rendimiento
- **Documentación**: OpenAPI/Swagger (cada módulo tiene su propia API)
- **Testing**: Jest para pruebas unitarias y e2e
- **Estructura**: Monorepo con backend/, frontend/, docs/

### 2. Estándares de Código
- **Lenguaje**: TypeScript estricto
- **Estilo**: ESLint + Prettier configurado
- **Estructura**: Módulos organizados por funcionalidad
- **DTOs**: Validación con class-validator
- **Respuestas**: Formato consistente de API

### 3. Principios de Desarrollo
- **API-First**: Especificación OpenAPI antes de implementación
- **Test-Driven**: Tests antes de código de producción
- **Documentación**: Código autodocumentado y README actualizado
- **Versionado**: Semantic versioning para releases
- **Seguridad**: Validación de entrada y sanitización

### 4. Estructura del Proyecto (Monorepo)
```
logisticaG12/
├── backend/                    # Backend (NestJS)
│   ├── src/
│   │   ├── shipping/          # Envíos
│   │   ├── config/            # Configuración
│   │   ├── vehicles/          # Vehículos
│   │   ├── routes/            # Rutas
│   │   └── integrations/      # Cliente Stock
│   ├── prisma/                # Base de datos
│   └── package.json
├── frontend/                   # Frontend (SvelteKit)
│   ├── src/
│   │   ├── routes/            # Páginas
│   │   └── lib/middleware/    # Servicios y stores
│   └── package.json
├── docs/                       # Documentación
└── docker-compose.yml
```

### 5. Reglas de Negocio
- **Estados de envío**: created → pickup_scheduled → picking_up → picked_up → out_for_delivery → delivered
- **Estados de error**: delivery_failed, cancelled, returning, returned
- **Tipos de transporte**: air, sea, rail, road
- **Cálculo de costos**: tarifa base + (peso volumétrico × tarifa/kg) + (distancia × tarifa/km)
- **Peso volumétrico**: MAX(peso real, (largo×ancho×alto)/factor)
- **Auditoría**: Logs de todos los cambios de estado
- **Cancelación**: Solo permitida en estados created y pickup_scheduled
- **Integración**: Por polling (no webhooks)

### 6. Calidad y Mantenimiento
- **Cobertura de tests**: Mínimo 80%
- **Performance**: Respuestas API < 200ms
- **Escalabilidad**: Diseño para microservicios
- **Monitoreo**: Logs estructurados y métricas
- **Deployment**: Docker containerizado

### 7. Colaboración
- **Commits**: Mensajes descriptivos en español
- **Branches**: main (producción), dev (integración), feature/* y fix/* (temporales)
- **Pull Requests**: Revisión obligatoria antes de merge
- **Documentación**: Actualización continua con cambios
- **Monorepo**: Un solo repositorio para todo el proyecto

## Objetivos del Proyecto

Este microservicio de logística debe:
1. Gestionar el ciclo completo de envíos
2. Calcular costos de transporte dinámicamente
3. Proporcionar tracking en tiempo real
4. Integrarse con otros microservicios del ecosistema
5. Mantener alta disponibilidad y rendimiento
6. Cumplir con estándares de seguridad y auditoría
