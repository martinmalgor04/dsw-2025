||# 🏗️ Arquitectura del Backend - Microservicios

## Visión general

El backend está construido con **arquitectura de microservicios** utilizando NestJS. Cada servicio es independiente con su propio `package.json`, `Dockerfile`, puerto y pipeline de despliegue. Los servicios se comunican vía HTTP y comparten bibliotecas comunes mediante NPM workspaces.

## 📦 Microservicios

### 1. Config Service (`port 3003`)
**Ubicación**: `backend/services/config-service`
**Responsabilidad**: Gestión de configuración del sistema y operaciones de flota.

**Módulos**:
- **Config**: Métodos de transporte, zonas de cobertura, configuraciones tarifarias
- **Fleet**: Conductores, vehículos, rutas de distribución

**Base de datos**: PostgreSQL via Prisma
**API Docs**: `http://localhost:3003/api/docs`
**Endpoints**: Ver `ENDPOINTS.md` en el directorio del servicio

---

### 2. Shipping Service (`port 3001`)
**Ubicación**: `backend/services/shipping-service`
**Responsabilidad**: Operaciones principales de logística y envíos.

**Características**:
- Cotización de costos de envío con peso volumétrico
- Creación y gestión de envíos
- Seguimiento de paquetes
- Cancelación de envíos
- Integración con Config Service (métodos transporte) y Stock Service (productos)

**Dependencias**: Geolib para cálculo de distancias
**Cache**: In-memory cache para cotizaciones (5 min TTL)
**API Docs**: `http://localhost:3001/api/docs`
**Endpoints**: Ver `ENDPOINTS.md` en el directorio del servicio

---

### 3. Stock Integration Service (`port 3002`)
**Ubicación**: `backend/services/stock-integration-service`
**Responsabilidad**: Cliente HTTP para integración con servicio externo de Stock.

**Características**:
- Circuit breaker para resiliencia (umbrales configurables)
- Política de reintentos (3 intentos con backoff exponencial)
- Cache Redis (5 min TTL) para productos frecuentes
- Fallback a respuestas mock en caso de falla total
- Monitoreo de salud del servicio externo

**Dependencias externas**: API de Stock del grupo 11
**Cache**: Redis
**API Docs**: `http://localhost:3002/api/docs`
**Endpoints**: Ver `ENDPOINTS.md` en el directorio del servicio (servicio interno, sin endpoints públicos)

---

### 4. Operator Interface Service (`port 3004`)
**Ubicación**: `backend/services/operator-interface-service`
**Responsabilidad**: API Gateway y facade para operadores internos.

**Patrón**: Smart Proxy / API Gateway
**Características**:
- Enrutamiento automático a servicios backend
- Service registry dinámico
- Request ID tracking (`X-Request-ID` header)
- Health check agregado de todos los servicios
- Endpoints locales para configuración frecuentemente accedida (coverage-zones, transport-methods)
- CORS configurado para frontend

**Routing Rules**:
- `/config/*` → Config Service (3003)
- `/shipping/*` → Shipping Service (3001)
- `/stock/*` → Stock Integration Service (3002)
- `/gateway/status` → Estado del gateway y service registry

**API Docs**: `http://localhost:3004/api/docs`
**Endpoints**: Ver `ENDPOINTS.md` en el directorio del servicio

---

## 🔗 Comunicación entre Servicios

```
Frontend (Next.js) - Port 3005
       ↓
Operator Interface (Gateway) - Port 3004
       ↓
    ┌──┴──┬──────┬───────┐
    ↓     ↓      ↓       ↓
  Config Shipping Stock  External
  (3003) (3001)  (3002)  Stock API
```

### Patrones de Comunicación

1. **API Gateway (Operator Interface)**:
   - Punto de entrada único para el frontend
   - Enruta requests a servicios apropiados
   - Agrega headers de tracing (`X-Request-ID`)
   - Maneja errores de servicios caídos (502, 504)

2. **Inter-Service HTTP**:
   - Shipping → Config (obtener tarifas y métodos de transporte)
   - Shipping → Stock Integration → External Stock API (validar productos)
   - Timeouts configurables por servicio

3. **Service Discovery**:
   - Configuración estática via variables de entorno
   - Health checks periódicos (cada 30s)
   - Circuit breaker para manejo de fallos

---

## 📚 Bibliotecas Compartidas (NPM Workspaces)

Ubicación: `backend/shared/`

### `@logistics/database`
- Esquema Prisma unificado
- `PrismaService` singleton
- Migraciones compartidas
- Tipos generados por Prisma

### `@logistics/types`
- DTOs comunes (Address, Product, etc.)
- Enums compartidos (TransportType, ShipmentStatus)
- Interfaces de dominio

### `@logistics/utils`
- Validadores reutilizables
- Utilidades de formateo
- Helpers de cálculo (distancias, pesos)

**Ventajas**:
- DRY: Sin duplicación de código
- Tipos consistentes entre servicios
- Actualizaciones centralizadas

---

## 🛠️ Stack Tecnológico

### Por Servicio

| Servicio | Framework | DB | Cache | Especial |
|----------|-----------|----|----|----------|
| Config | NestJS 10 | PostgreSQL (Prisma) | - | Fleet management |
| Shipping | NestJS 10 | PostgreSQL (Prisma) | In-memory (5min) | Geolib |
| Stock Integration | NestJS 10 | - | Redis (5min) | Circuit breaker, Axios |
| Operator Interface | NestJS 10 | PostgreSQL (Prisma) | - | Proxy routing |

### Común a Todos

- **Lenguaje**: TypeScript 5.1
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest (unit + E2E)
- **Containerización**: Docker + docker-compose
- **Logs**: NestJS Logger con contexto

---

## 📐 Capas y Patrones

Cada microservicio sigue la misma arquitectura en capas:

### 1. Capa de Presentación (Controllers)
- Validación de input con DTOs
- Mapeo de rutas HTTP
- Códigos de estado apropiados
- Decoradores Swagger completos

### 2. Capa de Dominio (Services)
- Reglas de negocio
- Orquestación de operaciones
- Manejo de errores de dominio
- Logging estructurado

### 3. Capa de Infraestructura
- Prisma (acceso a datos)
- HttpModule (llamadas externas)
- Cache (Redis / in-memory)
- Configuration (dotenv)

### Patrones Implementados

- **Repository Pattern**: PrismaService como capa de abstracción
- **Service Layer Pattern**: Lógica de negocio en services
- **DTO Pattern**: Transferencia de datos tipada y validada
- **Dependency Injection**: NestJS IoC container
- **Circuit Breaker**: Stock Integration (resiliencia)
- **API Gateway**: Operator Interface (facade)
- **Smart Proxy**: Enrutamiento dinámico con service registry

---

## 🔄 Flujo de Request Típico

### Ejemplo: Calcular costo de envío

```
1. Frontend → POST http://localhost:3004/shipping/cost
2. Operator Interface:
   - Genera X-Request-ID
   - Identifica target: shipping-service
   - Proxea → POST http://localhost:3001/shipping/cost
3. Shipping Service:
   - Valida DTO (origin, destination, products)
   - Consulta Config Service → GET http://localhost:3003/config/transport-methods
   - Consulta Stock Integration → POST http://localhost:3002/stock/products/batch
4. Stock Integration:
   - Verifica circuit breaker (estado CLOSED)
   - Intenta cache Redis (miss)
   - Llama API externa de Stock
   - Cachea respuesta (5 min)
   - Retorna productos validados
5. Shipping Service:
   - Calcula distancia (geolib)
   - Calcula peso volumétrico
   - Aplica tarifas según método de transporte
   - Retorna cotización con breakdown
6. Operator Interface:
   - Agrega headers: X-Response-Time, X-Service-Name
   - Retorna al Frontend
```

---

## 🔐 Seguridad

### Estado Actual (Desarrollo)
- Endpoints abiertos sin autenticación
- CORS configurado para `localhost:3000`, `localhost:3005`
- Validación de input con DTOs (whitelist + transform)
- Sanitización automática de datos

### Plan de Producción
- **Autenticación**: Keycloak + OAuth 2.0 / OIDC
- **Autorización**: JWT con scopes por recurso
- **Guards**: `@UseGuards(KeycloakGuard)` en controllers
- **Rate Limiting**: 100 req/min por IP, 1000 req/hora por usuario
- **Secrets**: Vault o AWS Secrets Manager
- **Auditoría**: Logs de acceso con requestId tracking

Ver `JWT-IMPLEMENTATION-GUIDE.md` y `KEYCLOAK-CONFIG.md` en Operator Interface Service.

---

## 📊 Observabilidad

### Implementado

1. **Health Checks**:
   - Todos los servicios: `GET /health`
   - Operator Interface: Health agregado con estado de backends
   - Stock Integration: Estado de circuit breaker

2. **Request Tracing**:
   - Header `X-Request-ID` en todos los requests
   - Propagación automática entre servicios
   - Logs correlacionados por requestId

3. **Logging Estructurado**:
   - NestJS Logger con contexto (servicio, método)
   - Niveles: debug, log, warn, error
   - Formato JSON en producción

### Plan Futuro

- **Métricas**: Prometheus + Grafana
  - Requests por segundo (RPS)
  - Response time (P50, P95, P99)
  - Error rate (% 4xx, 5xx)
  - Circuit breaker state changes

- **Tracing Distribuido**: Jaeger o OpenTelemetry
  - Spans por servicio
  - Trace completo de requests multi-servicio

- **Alertas**:
  - Error rate > 5%
  - Response time P95 > 1s
  - Circuit breaker OPEN

---

## 🧪 Testing

Cada microservicio tiene:

### Tests Unitarios (Jest)
- **Services**: Lógica de negocio aislada
- **Mocks**: Prisma, HttpService, cache
- **Coverage**: `npm run test:cov`
- **Ubicación**: `src/**/*.spec.ts`

### Tests E2E (Supertest)
- **Controllers**: HTTP requests completos
- **Setup**: TestingModule con AppModule
- **Cleanup**: Prisma deleteMany en afterAll
- **Ubicación**: `test/e2e/*.e2e-spec.ts`
- **Config**: `test/jest-e2e.json`

Ver `TESTS.md` en Operator Interface Service para guía completa.

### Comandos

```bash
# Por servicio
cd backend/services/<service-name>
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report

# Todos los servicios (desde root)
npm run test:all      # Unit tests todos los servicios
npm run test:e2e:all  # E2E tests todos los servicios
```

---

## 🚀 Despliegue

### Desarrollo Local

```bash
# 1. Levantar dependencias (PostgreSQL, Redis)
docker-compose up -d

# 2. Instalar dependencias
npm install

# 3. Generar cliente Prisma
cd backend/shared/database
npx prisma generate

# 4. Ejecutar migraciones
npx prisma migrate dev

# 5. Levantar servicios (paralelo)
npm run dev:all

# O individualmente:
cd backend/services/config-service && npm run start:dev
cd backend/services/shipping-service && npm run start:dev
cd backend/services/stock-integration-service && npm run start:dev
cd backend/services/operator-interface-service && npm run start:dev
```

### Producción (Docker)

Cada servicio tiene su propio `Dockerfile` optimizado:

```bash
# Build individual
cd backend/services/<service-name>
docker build -t logistics-<service-name>:latest .

# Build todos (docker-compose)
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

Ver `backend/docs/deployment/README.md` para guías detalladas de Dokploy.

---

## 🗄️ Base de Datos

### Esquema Unificado (Prisma)

Ubicación: `backend/shared/database/prisma/schema.prisma`

**Tablas Principales**:
- `CoverageZone` - Zonas de cobertura con códigos postales
- `TransportMethod` - Métodos de transporte (terrestre, aéreo, marítimo)
- `TariffConfig` - Configuración de tarifas por método
- `Driver` - Conductores de la flota
- `Vehicle` - Vehículos de la flota
- `Route` - Rutas de distribución
- `Shipment` - Envíos creados
- `ShipmentTracking` - Historial de seguimiento

**Convenciones**:
- Primary keys: UUID v4
- Timestamps: `createdAt`, `updatedAt` (auto-generados)
- Mapeo: snake_case (DB) ↔ camelCase (TypeScript) via `@map()`
- Soft deletes: Flag `isActive` (NO se eliminan registros)

Ver `backend/docs/database/README.md` para esquema completo y migraciones.

---

## 🔧 Configuración

### Variables de Entorno

Cada servicio tiene su `.env`:

```bash
# Config Service (.env)
PORT=3003
DATABASE_URL=postgresql://user:pass@localhost:5432/logistics
NODE_ENV=development

# Shipping Service (.env)
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/logistics
CONFIG_SERVICE_URL=http://localhost:3003
STOCK_SERVICE_URL=http://localhost:3002

# Stock Integration Service (.env)
PORT=3002
REDIS_URL=redis://localhost:6379
EXTERNAL_STOCK_API_URL=http://stock-api-external.com
CIRCUIT_BREAKER_THRESHOLD=5

# Operator Interface Service (.env)
PORT=3004
CONFIG_SERVICE_URL=http://localhost:3003
SHIPPING_SERVICE_URL=http://localhost:3001
STOCK_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3005
```

**Carga de configuración**:
- `@nestjs/config` con validación de schema
- Archivo `.env` ignorado por git (usar `.env.example`)
- ConfigModule.forRoot() en cada servicio

---

## 📖 Estándares de Código

### TypeScript

- **Strict mode**: Habilitado
- **No any**: Usar tipos explícitos
- **Interfaces over types**: Para objetos complejos
- **Decoradores**: Amplio uso de NestJS decorators

### DTOs

```typescript
// ✅ BIEN: Validación completa
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Dell XPS 15' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2.5, minimum: 0.1 })
  @IsNumber()
  @Min(0.1)
  weight: number;
}
```

### Controllers

- Usar decoradores HTTP apropiados (`@Get()`, `@Post()`, etc.)
- `@HttpCode()` para códigos no estándar
- Swagger completo: `@ApiOperation()`, `@ApiResponse()`, `@ApiBody()`
- Try-catch en métodos async (manejar excepciones)

### Services

- Métodos async con promesas
- Logging en operaciones importantes
- Lanzar excepciones de dominio (no códigos HTTP)
- Transacciones Prisma para operaciones multi-tabla

### Errores

```typescript
// ✅ BIEN: Excepciones tipificadas
throw new BadRequestException('Invalid product ID');
throw new NotFoundException(`Shipment ${id} not found`);

// ❌ MAL: Errores genéricos
throw new Error('Something went wrong');
```

---

## 📝 Documentación por Servicio

Cada microservicio incluye:

- **README.md**: Descripción, instalación, uso
- **ENDPOINTS.md**: API reference completa con ejemplos
- **Swagger UI**: Documentación interactiva en `/api/docs`
- **Tests**: Documentación ejecutable de comportamiento esperado

### Enlaces

- [Config Service](../../services/config-service/README.md) | [Endpoints](../../services/config-service/ENDPOINTS.md)
- [Shipping Service](../../services/shipping-service/README.md) | [Endpoints](../../services/shipping-service/ENDPOINTS.md)
- [Stock Integration](../../services/stock-integration-service/README.md) | [Endpoints](../../services/stock-integration-service/ENDPOINTS.md)
- [Operator Interface](../../services/operator-interface-service/README.md) | [Endpoints](../../services/operator-interface-service/ENDPOINTS.md)

---

## 🎯 Roadmap Arquitectónico

### Corto Plazo (Q1 2025)
- ✅ Separación completa en microservicios
- ✅ E2E tests completos
- ✅ Documentación OpenAPI actualizada
- ⏳ Implementar autenticación Keycloak
- ⏳ Rate limiting por servicio

### Mediano Plazo (Q2 2025)
- Event-driven architecture (RabbitMQ / Kafka)
- Service mesh (Istio)
- Observabilidad completa (Prometheus + Grafana + Jaeger)
- CI/CD automatizado (GitHub Actions)

### Largo Plazo (Q3-Q4 2025)
- Kubernetes deployment
- Auto-scaling por servicio
- Multi-region deployment
- Disaster recovery plan

---

## 📚 Referencias

- **APIs**: [backend/docs/api/README.md](../api/README.md)
- **Base de Datos**: [backend/docs/database/README.md](../database/README.md)
- **Despliegue**: [backend/docs/deployment/README.md](../deployment/README.md)
- **Geolocalización**: [backend/docs/geolocation/README.md](../geolocation/README.md)
- **Redis**: [backend/docs/redis/README.md](../redis/README.md)

---

**Última actualización**: 6 de Noviembre de 2025
**Versión de arquitectura**: Microservicios 1.0
**Mantenido por**: Grupo 12 - UTN FRRE

