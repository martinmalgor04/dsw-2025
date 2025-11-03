# 🚀 Operator Interface Service - Gateway & Proxy Inteligente

## 📌 Descripción General

El **Operator Interface Service** es el **punto de entrada único** (gateway) para todas las solicitudes del frontend. Su rol es:

- 🔀 **Ruteo Inteligente**: Descubre y rutea requests a los microservicios correctos
- 📡 **Proxy Transparente**: Reenvía requests sin modificar la lógica de negocio
- 🔒 **Seguridad**: Valida JWT, enforza scopes, aplica rate limiting
- 📊 **Observabilidad**: Correlaciona requests con X-Request-ID, logs estructurados
- 🛡️ **Resiliencia**: Reintentos automáticos, circuit breaker, timeouts
- ❤️ **Health Checks**: Monitorea salud de todos los microservicios

## 🏗️ Arquitectura

### Componentes Principales

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js :3000)                           │
│  - React components                                 │
│  - Keycloak authentication                          │
└────────────────┬────────────────────────────────────┘
                 │
    NEXT_PUBLIC_API_URL=http://localhost:3004
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  OPERATOR INTERFACE SERVICE (Gateway :3004)         │
├─────────────────────────────────────────────────────┤
│  1. ProxyController (@All('*'))                     │
│     └─ Captura todas las rutas no manejadas         │
│                                                     │
│  2. ServiceFacade (Orquestación)                    │
│     ├─ requestWithRetry() - Reintentos             │
│     ├─ Circuit Breaker - Fallos en cascada         │
│     └─ Timeout por servicio - Configurables        │
│                                                     │
│  3. ServiceRegistry (Service Discovery)             │
│     ├─ Descubre servicios desde env vars            │
│     ├─ Health checks cada 30 segundos               │
│     └─ Rutea by prefix (/config → :3003)           │
│                                                     │
│  4. Middlewares de Seguridad & Observabilidad      │
│     ├─ JWT Guard - Valida tokens                    │
│     ├─ Rate Limiter - Throttling por IP/ruta       │
│     ├─ Request ID - Genera UUID para correlation   │
│     └─ Logging - Registra todos los requests       │
└──────┬───────────┬──────────────┬──────────────────┘
       │           │              │
       │           │              │
    :3003      :3001         :3002
       │           │              │
       ▼           ▼              ▼
┌────────────┐┌────────────┐┌─────────────────┐
│   Config   ││  Shipping  ││ Stock           │
│  Service   ││  Service   ││ Integration     │
│            ││            ││                 │
│ - /config  ││ - /shipping││ - /stock        │
│ - /fleet   ││            ││                 │
└────────────┘└────────────┘└─────────────────┘
```

### Patrón de Comunicación

```
Cliente Request
     │
     ▼
ProxyController
     │
     ├─ Extrae ruta: "/config/transport-methods"
     │
     ▼
ServiceFacade.request()
     │
     ├─ Genera X-Request-ID (UUID)
     │
     ▼
ServiceRegistry.findServiceByRoute()
     │
     ├─ Extrae prefijo: "/config"
     ├─ Busca servicio registrado
     └─ Encuentra: config-service @ :3003
     │
     ▼
requestWithRetry()
     │
     ├─ Intento 1/3: GET http://localhost:3003/config/transport-methods
     │
     ├─ ✅ 200 OK → Retorna respuesta
     │ ❌ 502/503/429 → Reintento con backoff exponencial
     │ ❌ Error fatal → Retorna error al cliente
     │
     ▼
Response con X-Request-ID header
```

## 🔧 Configuración

### Variables de Entorno

Ubicación: `.env` o `.env.local` en `backend/services/operator-interface-service/`

```env
# Puerto del gateway
PORT=3004

# Base URL para descubrimiento de servicios
BACKEND_BASE_URL=http://localhost

# Timeouts por servicio (en ms)
CONFIG_SERVICE_TIMEOUT=5000
SHIPPING_SERVICE_TIMEOUT=5000
STOCK_INTEGRATION_SERVICE_TIMEOUT=5000

# Rate limiting (requests por minuto)
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# JWT/Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=logistica

# Node environment
NODE_ENV=development
```

### Mapeo de Servicios

Los servicios se registran automáticamente en `src/core/service-registry.ts`:

```typescript
const servicesConfig = [
  {
    name: 'config-service',
    baseUrl: `${baseUrl}:3003`,
    routes: ['/config', '/fleet'],  // ← Prefijos de rutas
    healthCheckUrl: '/health',
  },
  {
    name: 'shipping-service',
    baseUrl: `${baseUrl}:3001`,
    routes: ['/shipping'],
    healthCheckUrl: '/health',
  },
  {
    name: 'stock-integration-service',
    baseUrl: `${baseUrl}:3002`,
    routes: ['/stock'],
    healthCheckUrl: '/health',
  },
];
```

**Para agregar un nuevo servicio:**
1. Agregar entrada en `servicesConfig`
2. NO modificar frontend - se descubre automáticamente ✨

## 🔄 Resiliencia

### 1. Reintentos Automáticos

- **Solo GET requests** - Idempotentes y seguros
- **Hasta 3 intentos** - Configurable en `service-facade.ts`
- **Backoff exponencial** - Espera: 100ms → 200ms → 400ms
- **Statuses reintentables**: 408, 429, 500, 502, 503, 504

Ejemplo:
```typescript
// Reintento automático
GET /config/transport-methods
├─ Intento 1: TIMEOUT (408)
│   └─ Espera 100ms
├─ Intento 2: BAD_GATEWAY (502)
│   └─ Espera 200ms
├─ Intento 3: OK (200) ✅
```

### 2. Circuit Breaker

Si un servicio falla 5 veces consecutivas:
- ⚠️ **Se marca como "unhealthy"**
- 🔴 **Se abre el circuit breaker** - No envía más requests
- ⏱️ **Espera 30 segundos** - Luego intenta recuperarse
- ✅ **Si se recupera** - Vuelve a healthy status

Logs:
```
⚠️  Service marked as unhealthy: config-service (5 failures)
❌ Circuit breaker OPEN for config-service - requests will fail fast
✅ Circuit breaker CLOSED for config-service - recovered
```

### 3. Timeouts por Servicio

Cada servicio tiene su timeout configurable:

```env
CONFIG_SERVICE_TIMEOUT=5000       # 5 segundos
SHIPPING_SERVICE_TIMEOUT=5000     # 5 segundos
STOCK_INTEGRATION_SERVICE_TIMEOUT=5000
```

Si un request tarda más que el timeout:
- ⏱️ **Se cancela automáticamente**
- 📤 **Retorna 504 Gateway Timeout**
- 🔄 **Se reintenta (si es GET)**

## 📊 Observabilidad

### X-Request-ID - Correlación de Requests

Cada request obtiene un **UUID v4 único**:

```
Request:
GET /config/transport-methods HTTP/1.1
Host: localhost:3004

Response:
HTTP/1.1 200 OK
X-Request-ID: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
Content-Type: application/json

[...]
```

**Uso**: Busca este ID en los logs del gateway y del servicio downstream para correlacionar la request completa.

### Logging Estructurado

Cada request genera 2 logs JSON:

**Inicio del request**:
```json
{
  "timestamp": "2025-11-03T16:30:45.123Z",
  "level": "info",
  "message": "🔄 Incoming request",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "method": "GET",
  "path": "/config/transport-methods",
  "ip": "127.0.0.1"
}
```

**Fin del request**:
```json
{
  "timestamp": "2025-11-03T16:30:45.234Z",
  "level": "info",
  "message": "✅ Response sent",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "method": "GET",
  "path": "/config/transport-methods",
  "status": 200,
  "durationMs": 111
}
```

### Health Checks & Service Status

**Endpoint**: `GET /gateway/status`

```bash
curl http://localhost:3004/gateway/status
```

Respuesta:
```json
{
  "services": [
    {
      "name": "config-service",
      "baseUrl": "http://localhost:3003",
      "routes": ["/config", "/fleet"],
      "isHealthy": true,
      "lastHealthCheck": "2025-11-03T16:30:45.123Z"
    },
    {
      "name": "shipping-service",
      "baseUrl": "http://localhost:3001",
      "routes": ["/shipping"],
      "isHealthy": true,
      "lastHealthCheck": "2025-11-03T16:30:45.123Z"
    },
    {
      "name": "stock-integration-service",
      "baseUrl": "http://localhost:3002",
      "routes": ["/stock"],
      "isHealthy": false,
      "lastHealthCheck": "2025-11-03T16:30:40.456Z"
    }
  ],
  "timestamp": "2025-11-03T16:30:45.789Z"
}
```

## 🔐 Seguridad

### JWT Authentication Guard

Protege endpoints sensibles:

```typescript
@UseGuards(AuthGuard)
@Post('/config/tariff-configs')
async createTariff(@Body() data: CreateTariffDto) {
  // Solo usuarios autenticados pueden llegar aquí
}
```

### Rate Limiting

Previene abuso:

```typescript
@UseGuards(RateLimitGuard)
@Get('/config/transport-methods')
async getTransportMethods() {
  // Limitado a X requests por minuto por IP
}
```

## 📝 Endpoints Principales

### Gateway Health
- `GET /health` - Health status del gateway
- `GET /gateway/status` - Status de todos los servicios

### Config Service (vía gateway :3004)
- `GET /config/transport-methods` - Listar métodos
- `POST /config/transport-methods` - Crear
- `GET /config/coverage-zones` - Listar zonas
- `GET /config/tariff-configs` - Listar tarifas
- `GET /fleet/vehicles` - Listar vehículos
- `GET /fleet/drivers` - Listar conductores

### Shipping Service (vía gateway :3004)
- `GET /shipping/shipments` - Listar envíos
- `POST /shipping/quotes` - Calcular cotización
- `GET /shipping/quotes/:id` - Obtener cotización

### Stock Service (vía gateway :3004)
- `GET /stock/inventory` - Inventario disponible
- `POST /stock/reserve` - Reservar stock

## 🧪 Testing

### E2E Tests

Los tests validan que el gateway rutea correctamente:

```bash
# Ejecutar todos los E2E tests
pnpm test:e2e

# O desde la carpeta del operator
cd backend/services/operator-interface-service
pnpm test:e2e

# Tests específicos
pnpm test:e2e config.transport-methods
pnpm test:e2e config.tariff-configs
pnpm test:e2e gateway.unknown
```

### Tests Incluidos

- **T019**: GET /config/transport-methods vía gateway
- **T020**: CRUD /config/tariff-configs vía gateway
- **T021**: Error handling, X-Request-ID tracing, health endpoints

## ⚠️ Troubleshooting

### El gateway retorna 502 Bad Gateway

**Causas**:
1. ❌ Servicio downstream no está corriendo
2. ❌ URL del servicio es incorrecta
3. ❌ Firewall bloqueando conexión
4. ❌ Servicio tarda más que el timeout

**Solución**:
```bash
# Chequear status de servicios
curl http://localhost:3004/gateway/status

# Verificar que servicios están corriendo
docker-compose ps

# Chequear logs del gateway
pnpm start:dev

# Probar conexión directa al servicio
curl http://localhost:3003/health
```

### Servicio marcado como "unhealthy"

**Causas**:
- El health check endpoint no responde
- El servicio está down pero el gateway aún lo intenta

**Solución**:
```bash
# Ver logs del gateway para errores de health check
pnpm start:dev | grep "health check"

# Reiniciar el servicio fallido
pnpm start:dev:config

# El gateway lo detectará en el próximo health check (30s)
```

### Requests lentasTimeouts

**Solución**:
```env
# Aumentar timeout para servicios lentos
CONFIG_SERVICE_TIMEOUT=10000  # 10 segundos
```

## 📚 Archivos Importantes

```
backend/services/operator-interface-service/
├── src/
│   ├── core/
│   │   ├── service-registry.ts      # Service discovery
│   │   ├── service-facade.ts        # Reintentos, circuit breaker
│   │   └── core.module.ts
│   ├── middleware/
│   │   ├── auth.guard.ts            # JWT validation
│   │   ├── rate-limit.middleware.ts # Rate limiting
│   │   ├── request-id.middleware.ts # X-Request-ID generation
│   │   └── logging.middleware.ts    # Structured logging
│   ├── core/
│   │   └── proxy.controller.ts      # @All('*') route capture
│   └── app.module.ts
├── test/
│   ├── e2e/
│   │   ├── config.transport-methods.e2e.spec.ts
│   │   ├── config.tariff-configs.e2e.spec.ts
│   │   └── gateway.unknown.e2e.spec.ts
│   └── jest-e2e.json
└── GATEWAY.md (este archivo)
```

## 🚀 Desarrollo

### Agregar Nuevo Microservicio

1. **Registrar en ServiceRegistry** (`src/core/service-registry.ts`):
```typescript
{
  name: 'mi-nuevo-servicio',
  baseUrl: 'http://localhost:3005',
  routes: ['/mi-endpoint'],
  healthCheckUrl: '/health',
}
```

2. **Configurar timeout env** (opcional):
```env
MI_NUEVO_SERVICIO_TIMEOUT=5000
```

3. **Frontend automáticamente lo descubre** - No hay cambios necesarios

### Modificar Comportamiento de Reintentos

Editar `src/core/service-facade.ts`:
- `MAX_RETRIES` - Número máximo de reintentos
- `INITIAL_DELAY_MS` - Delay inicial en backoff exponencial
- `RETRYABLE_STATUSES` - Códigos HTTP que disparan reintentos

### Agregar Custom Middleware

```typescript
// En app.module.ts
@Module({
  imports: [CoreModule, SecurityModule, /* ... */],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MiCustomMiddleware)
      .forRoutes('*');
  }
}
```

## 📞 Referencias

- Documentación del Proyecto: [README.md](../../README.md)
- Guía de Operación: [OPERATE-BACKEND.md](./OPERATE-BACKEND.md)
- NestJS Documentation: https://docs.nestjs.com
- Patrón Service Discovery: https://microservices.io/patterns/service-discovery/client-side-discovery.html
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
**Autor**: Grupo 12 - UTN FRRE
