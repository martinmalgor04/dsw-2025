# 🚀 Arquitectura de Microservicios - Logística Grupo 12

## 📋 Visión General

Este proyecto ha sido migrado de una arquitectura monolítica modular a **microservicios verdaderos** manteniendo base de datos compartida para simplificar la transición.

## 🎯 Arquitectura de Microservicios

Este backend implementa una arquitectura de microservicios escal­able usando NestJS 10 y Prisma ORM.

## ✅ Problemas Resueltos - Tipos Explícitos de Prisma (Solución Duradera)

### Problema
Durante la compilación del TypeScript, se presentaban errores `TS2742` sobre "tipos no portables" al interactuar con Prisma:
```
The inferred type of 'findAll' cannot be named without a reference to '../../../../shared/database/node_modules/@prisma/client/runtime/library'
```

### Causa Raíz
Cuando un método async **no tiene tipo de retorno explícito**, TypeScript debe inferirlo. Con Prisma, esto genera referencias a rutas internas del `node_modules` de `@prisma/client`, que no son portables entre diferentes contextos de compilación.

### Solución Duradera ✨
Se agregaron **tipos de retorno explícitos** a todos los métodos que interactúan con Prisma:

#### En Services (ejemplos):
```typescript
// ❌ ANTES (causa TS2742)
async findAll() {
  return this.prisma.transportMethod.findMany();
}

// ✅ DESPUÉS (solución duradera)
async findAll(): Promise<TransportMethod[]> {
  return this.prisma.transportMethod.findMany();
}
```

#### En Controllers (ejemplos):
```typescript
// ❌ ANTES
async create(@Body() dto: CreateTransportMethodDto) {
  return this.transportMethodService.create(dto);
}

// ✅ DESPUÉS
async create(@Body() dto: CreateTransportMethodDto): Promise<TransportMethod> {
  return this.transportMethodService.create(dto);
}
```

#### Importaciones de Tipos desde @logistics/database:
```typescript
// ✅ Correcto
import { PrismaService, TransportMethod, Driver, Vehicle, Route } from '@logistics/database';

// ❌ Incorrecto (y causa TS2307)
import { TransportMethod } from '@prisma/client'; 
```

### Archivos Modificados con Tipos Explícitos

#### Config Service:
- `transport-method.service.ts` - Todos los métodos con tipos Promise
- `transport-method.controller.ts` - Todos los métodos async con tipos Promise
- `coverage-zone.service.ts` - Todos los métodos con tipos Promise
- `coverage-zone.controller.ts` - Todos los métodos async con tipos Promise

#### Operator Interface Service (Fleet Module):
- `fleet/services/drivers.service.ts` - Promise<Driver> | Promise<Driver[]>
- `fleet/drivers.controller.ts` - Promise<Driver> | Promise<Driver[]>
- `fleet/services/vehicles.service.ts` - Promise<Vehicle> | Promise<Vehicle[]>
- `fleet/vehicles.controller.ts` - Promise<Vehicle> | Promise<Vehicle[]>
- `fleet/services/routes.service.ts` - Promise<Route> | Promise<Route[]>
- `fleet/routes.controller.ts` - Promise<Route> | Promise<Route[]>

#### Shipping Service:
- ✅ Ya tenía tipos explícitos en todos los métodos

### Patrón a Seguir en Nuevas Funciones
1. Todos los métodos `async` deben tener tipo de retorno explícito
2. Para retornos de Prisma, usar `Promise<TipoEntidad>` o `Promise<TipoEntidad[]>`
3. Importar tipos desde `@logistics/database`, no desde `@prisma/client`
4. Esto garantiza compilación correcta sin warnings de tipo no portables

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (SvelteKit)                        │
│                    Puerto: 5173                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                  MIDDLEWARE                                     │
│            (Conecta Frontend ↔ Backend)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              OPERATOR INTERFACE SERVICE                        │
│                   Puerto: 3004                                 │
│          APIs internas para operarios                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   CONFIG    │ │    STOCK    │ │  SHIPPING   │
│  SERVICE    │ │INTEGRATION  │ │  SERVICE    │
│Puerto: 3003 │ │Puerto: 3002 │ │Puerto: 3001 │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              │   Puerto: 5432  │
              │ (BD Compartida) │
              └─────────────────┘
```

## 🎯 Servicios

### 1. **Config Service** (Puerto 3003)
- **Responsabilidad**: Métodos de transporte y zonas de cobertura
- **Base de datos**: PostgreSQL (shared)
- **APIs**: Configuración de transporte y zonas

### 2. **Stock Integration Service** (Puerto 3002)
- **Responsabilidad**: Cliente HTTP para módulo Stock externo
- **Cache**: Redis para optimización
- **Features**: Circuit breaker, reintentos, fallback

### 3. **Shipping Service** (Puerto 3001)
- **Responsabilidad**: Lógica principal de envíos
- **Base de datos**: PostgreSQL (shared)
- **Comunicación**: HTTP con config-service y stock-integration

### 4. **Operator Interface Service** (Puerto 3004)
- **Responsabilidad**: APIs internas para frontend de operarios
- **Función**: Agregador que llama a otros servicios
- **Compatibilidad**: 100% con API-ENDPOINTS-INTERNOS.md

## 📚 Bibliotecas Compartidas

### `@logistics/database`
- Prisma client configurado
- Health checks
- Gestión de conexiones

### `@logistics/types`
- DTOs compartidos
- Enums del dominio
- Interfaces comunes

### `@logistics/utils`
- HTTP client con reintentos
- Logger estructurado
- Utilidades comunes

## 🚀 Comandos Rápidos

### Desarrollo
```bash
# Iniciar todos los microservicios
npm run dev

# O usando el script personalizado
./scripts/microservices.sh dev

# Iniciar un servicio específico
./scripts/microservices.sh dev-service config-service
```

### Gestión de Servicios
```bash
# Ver estado de todos los servicios
./scripts/microservices.sh status

# Ver logs de todos los servicios
./scripts/microservices.sh logs

# Ver logs de un servicio específico
./scripts/microservices.sh logs-service shipping-service

# Health check de todos los servicios
./scripts/microservices.sh health
```

### Compilación y Testing
```bash
# Compilar shared libraries y servicios
./scripts/microservices.sh build

# Ejecutar tests de todos los servicios
./scripts/microservices.sh test

# Limpiar containers y volúmenes
./scripts/microservices.sh clean
```

## 🔧 Configuración

### Variables de Entorno

Cada servicio usa estas variables base:
```env
NODE_ENV=development
DATABASE_URL=postgresql://logistica_user:logistica_pass@localhost:5432/logistica_db
```

#### Config Service (3003)
```env
PORT=3000
```

#### Stock Integration Service (3002)
```env
PORT=3000
REDIS_URL=redis://localhost:6379
STOCK_API_BASE_URL=http://stock.ds.frre.utn.edu.ar:3000
```

#### Shipping Service (3001)
```env
PORT=3000
CONFIG_SERVICE_URL=http://localhost:3003
STOCK_SERVICE_URL=http://localhost:3002
```

#### Operator Interface Service (3004)
```env
PORT=3000
CONFIG_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:5173
```

## 📊 Puertos y URLs

| Servicio | Puerto | URL Local | Swagger Docs |
|----------|--------|-----------|--------------|
| Operator Interface | 3004 | http://localhost:3004 | http://localhost:3004/api/docs |
| Config Service | 3003 | http://localhost:3003 | http://localhost:3003/api/docs |
| Stock Integration | 3002 | http://localhost:3002 | http://localhost:3002/api/docs |
| Shipping Service | 3001 | http://localhost:3001 | http://localhost:3001/api/docs |
| PostgreSQL | 5432 | localhost:5432 | - |
| Redis | 6379 | localhost:6379 | - |

## 🔄 Comunicación Entre Servicios

### Operator Interface → Config Service
```javascript
GET http://config-service:3000/transport-methods
GET http://config-service:3000/coverage-zones
```

### Shipping Service → Stock Integration
```javascript
GET http://stock-integration-service:3000/products/:id
GET http://stock-integration-service:3000/reservas/:id
```

### Shipping Service → Config Service
```javascript
GET http://config-service:3000/transport-methods
GET http://config-service:3000/coverage-zones
```

## 🐳 Docker

### Desarrollo Local
```bash
# Levantar todo el stack
docker-compose -f docker-compose.microservices.yml up --build

# Levantar servicios específicos
docker-compose -f docker-compose.microservices.yml up postgres redis config-service
```

### Estructura de Containers
- **postgres**: Base de datos compartida
- **redis**: Cache compartido
- **config-service**: Microservicio de configuración
- **stock-integration-service**: Cliente para Stock
- **shipping-service**: Lógica de envíos
- **operator-interface-service**: APIs internas

## 🔍 Health Checks

Todos los servicios exponen un endpoint `/health`:

```bash
curl http://localhost:3001/health  # Shipping Service
curl http://localhost:3002/health  # Stock Integration
curl http://localhost:3003/health  # Config Service  
curl http://localhost:3004/health  # Operator Interface
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T21:00:00.000Z",
  "service": "Service Name",
  "version": "1.0.0",
  "environment": "development",
  "dependencies": {
    "database": "healthy"
  }
}
```

## 🚨 Troubleshooting

### Servicio no responde
```bash
# Verificar logs
./scripts/microservices.sh logs-service <nombre-servicio>

# Verificar estado del container
docker-compose -f docker-compose.microservices.yml ps
```

### Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté funcionando
docker-compose -f docker-compose.microservices.yml exec postgres pg_isready

# Reiniciar servicios
./scripts/microservices.sh stop
./scripts/microservices.sh dev
```

### Problemas de compilación
```bash
# Limpiar y recompilar
./scripts/microservices.sh clean
./scripts/microservices.sh build
```

## 📝 Próximos Pasos

1. **Implementar HTTP clients**: Reemplazar mocks con calls reales entre servicios
2. **Añadir métricas**: Prometheus + Grafana para monitoreo
3. **Implementar tracing**: Jaeger para debugging distribuido
4. **CI/CD**: Pipeline para deployment independiente
5. **API Gateway**: Si se decide centralizar routing

## 🤝 Compatibilidad

- ✅ **100% compatible** con API-ENDPOINTS-INTERNOS.md
- ✅ **Cero breaking changes** para el frontend
- ✅ **Misma funcionalidad** que el monolito original
- ✅ **Preparado para scaling** independiente por servicio