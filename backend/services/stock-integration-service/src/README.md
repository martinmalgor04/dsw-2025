# Stock Integration Module

Este módulo proporciona integración robusta con la API de Stock, incluyendo circuit breaker, caché, reintentos automáticos y manejo de errores.

## 🚀 Características

- **Cliente HTTP robusto** con reintentos automáticos y backoff exponencial
- **Circuit Breaker** para evitar cascadas de fallos
- **Caché en memoria** con TTL configurable
- **Autenticación JWT** con Keycloak
- **Logging estructurado** para monitoreo
- **Fallbacks automáticos** cuando Stock API no está disponible
- **Tests completos** (unitarios e integración)

## 📁 Estructura del Módulo

```
stock-integration/
├── services/
│   ├── stock-integration.service.ts      # Servicio principal
│   ├── stock-circuit-breaker.service.ts  # Circuit breaker
│   └── stock-cache.service.ts            # Servicio de caché
├── dto/
│   ├── producto-stock.dto.ts             # DTOs para productos
│   ├── reserva-stock.dto.ts              # DTOs para reservas
│   └── index.ts                          # Exports
├── interfaces/
│   └── stock-api.interface.ts            # Interfaces TypeScript
├── guards/
│   └── stock-auth.guard.ts               # Guard de autenticación
├── interceptors/
│   ├── stock-retry.interceptor.ts        # Interceptor de reintentos
│   └── stock-logging.interceptor.ts      # Interceptor de logging
├── config/
│   └── stock-config.validator.ts         # Validador de configuración
├── __tests__/
│   ├── integration/
│   │   └── stock-api.integration.spec.ts # Tests de integración
│   ├── stock-integration.service.spec.ts # Tests del servicio principal
│   ├── stock-circuit-breaker.service.spec.ts # Tests del circuit breaker
│   └── stock-cache.service.spec.ts       # Tests del caché
└── stock-integration.module.ts           # Módulo principal
```

## 🔧 Configuración

### Variables de Entorno

```bash
# Stock API Configuration
STOCK_API_URL=https://stock.ds.frre.utn.edu.ar/v1
STOCK_API_TIMEOUT=2000
STOCK_API_RETRY_ATTEMPTS=3
STOCK_API_RETRY_DELAY=1000

# Circuit Breaker Configuration
STOCK_CIRCUIT_BREAKER_THRESHOLD=5
STOCK_CIRCUIT_BREAKER_TIMEOUT=30000

# Cache Configuration
STOCK_CACHE_TTL=600
STOCK_CACHE_MAX_ITEMS=1000

# Redis Configuration (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# OAuth2 Configuration (Keycloak)
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=ds-2025-realm
KEYCLOAK_CLIENT_ID=logistica-service
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_GRANT_TYPE=client_credentials
```

### Validación de Configuración

```bash
# Validar configuración
./scripts/validate-stock-config.sh

# Validar para entorno específico
./scripts/validate-stock-config.sh production
```

## 🚀 Uso

### Importar el Módulo

```typescript
import { StockIntegrationModule } from './src/stock-integration/stock-integration.module';

@Module({
  imports: [StockIntegrationModule],
  // ...
})
export class AppModule {}
```

### Usar el Servicio

```typescript
import { StockIntegrationService } from './src/stock-integration/services/stock-integration.service';

@Injectable()
export class MyService {
  constructor(
    private stockIntegration: StockIntegrationService,
  ) {}

  async getProductInfo(productId: number) {
    // Obtener producto con fallback automático
    const product = await this.stockIntegration.getProductById(productId);
    return product;
  }

  async getReservaByCompra(compraId: string, userId: number) {
    // Buscar reserva por ID de compra
    const reserva = await this.stockIntegration.getReservaByCompraId(compraId, userId);
    return reserva;
  }

  async updateReservaStatus(reservaId: number, estado: string, userId: number) {
    // Actualizar estado de reserva
    const reserva = await this.stockIntegration.updateReservaStatus(
      reservaId, 
      estado as any, 
      userId
    );
    return reserva;
  }
}
```

## 🔄 Flujo de Trabajo con Reservas

### 1. Obtener Reserva por ID de Compra

```typescript
// 1. Listar reservas del usuario
const reservas = await stockService.getReservasByUsuario(userId);

// 2. Buscar por idCompra
const reserva = reservas.find(r => r.idCompra === "COMPRA-XYZ-12345");

// 3. Obtener idReserva para usar en operaciones posteriores
const idReserva = reserva.idReserva;
```

### 2. Obtener Detalles de Reserva

```typescript
// Usar el idReserva obtenido anteriormente
const reservaDetalle = await stockService.getReservaById(idReserva, userId);
```

### 3. Actualizar Estado de Reserva

```typescript
// Cambiar estado cuando se procesa el envío
await stockService.updateReservaStatus(idReserva, 'confirmado', userId);
```

### 4. Método Helper Completo

```typescript
// Método que hace todo en uno
const reservaActualizada = await stockService.getAndUpdateReservaStatus(
  "COMPRA-XYZ-12345", 
  userId, 
  'confirmado'
);
```

## 🛡️ Circuit Breaker

El circuit breaker protege contra cascadas de fallos:

- **CLOSED**: Estado normal, requests pasan
- **OPEN**: Demasiados fallos, requests bloqueados
- **HALF_OPEN**: Probando si el servicio se recuperó

### Configuración

- **Umbral**: 5 fallos consecutivos
- **Timeout**: 30 segundos antes de probar nuevamente
- **Recuperación**: Automática tras primer éxito

## 💾 Caché

### Configuración

- **TTL**: 10 minutos por defecto
- **Store**: Memoria (Redis opcional)
- **Claves**: Estructuradas (`stock:product:{id}`, `stock:reserva:{id}`)

### Operaciones

```typescript
// Obtener del caché
const cached = await cache.get('stock:product:123');

// Guardar en caché
await cache.set('stock:product:123', product, 600);

// Eliminar del caché
await cache.delete('stock:product:123');

// Limpiar todo el caché
await cache.clear();
```

## 🔄 Reintentos

### Configuración

- **Intentos**: 3 por defecto
- **Delay**: Backoff exponencial (1s, 2s, 4s)
- **Errores**: Solo reintenta errores de red y 5xx

### Errores que se Reintentan

- `ECONNREFUSED`
- `ETIMEDOUT`
- `ENOTFOUND`
- Errores HTTP 5xx
- Error 429 (Too Many Requests)

## 🔐 Autenticación

### Keycloak Integration

```typescript
// El guard maneja automáticamente:
// 1. Obtención de token JWT
// 2. Refresh automático
// 3. Cache de tokens
// 4. Validación de scopes
```

### Scopes Requeridos

- `productos:read` - Para consultar productos
- `reservas:read` - Para consultar reservas
- `reservas:write` - Para actualizar estados de reserva

## 📊 Monitoreo

### Health Check

```typescript
const health = await stockIntegration.healthCheck();
console.log(health);
// {
//   service: 'StockIntegrationService',
//   status: 'healthy',
//   circuitBreaker: { state: 'CLOSED', ... },
//   cache: true
// }
```

### Logs Estructurados

```json
{
  "timestamp": "2025-01-17T10:30:00Z",
  "level": "info",
  "service": "stock-integration",
  "method": "getProductById",
  "productId": 123,
  "duration": 150,
  "status": "success",
  "circuitBreakerState": "CLOSED",
  "cacheHit": false,
  "retryAttempt": 1
}
```

## 🧪 Testing

### Tests Unitarios

```bash
# Ejecutar todos los tests
npm test

# Tests específicos del módulo
npm test -- --testPathPattern=stock-integration

# Con cobertura
npm run test:cov
```

### Tests de Integración

```bash
# Tests de integración (requiere configuración)
npm run test:e2e
```

### Mocks

Los tests usan mocks para simular respuestas de Stock API:

```typescript
// Mock de HttpService
jest.spyOn(httpService, 'request').mockReturnValue(of({ data: mockProduct }));

// Mock de Circuit Breaker
jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);

// Mock de Cache
jest.spyOn(cache, 'get').mockResolvedValue(mockProduct);
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Circuit Breaker Abierto

```bash
# Verificar estado
curl http://localhost:3000/health

# Resetear circuit breaker (en desarrollo)
# El circuit breaker se resetea automáticamente tras el timeout
```

#### 2. Errores de Autenticación

```bash
# Verificar configuración de Keycloak
./scripts/validate-stock-config.sh

# Verificar conectividad
curl -I https://keycloak.example.com/realms/ds-2025-realm
```

#### 3. Problemas de Caché

```bash
# Limpiar caché
curl -X DELETE http://localhost:3000/cache/clear

# Verificar health check del caché
curl http://localhost:3000/health
```

#### 4. Timeouts

```bash
# Verificar conectividad con Stock API
curl -I https://stock.ds.frre.utn.edu.ar/v1/health

# Ajustar timeout en .env
STOCK_API_TIMEOUT=5000
```

### Logs de Debug

```bash
# Habilitar logs detallados
LOG_LEVEL=debug npm run start:dev

# Filtrar logs de Stock Integration
npm run start:dev | grep "StockIntegration"
```

## 📈 Métricas

### Métricas Disponibles

- **Latencia**: Tiempo de respuesta de Stock API
- **Throughput**: Requests por segundo
- **Circuit Breaker**: Estado y transiciones
- **Cache**: Hit rate y operaciones
- **Errores**: Por tipo y endpoint

### Dashboard

```typescript
// Endpoint de métricas (si está implementado)
GET /metrics/stock-integration
```

## 🔄 Actualizaciones

### Versionado

El módulo sigue semantic versioning:

- **MAJOR**: Cambios incompatibles en API
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Bug fixes

### Changelog

Ver `CHANGELOG.md` para historial de cambios.

## 🤝 Contribución

### Desarrollo

1. Fork del repositorio
2. Crear feature branch
3. Implementar cambios
4. Agregar tests
5. Ejecutar validaciones
6. Crear pull request

### Validaciones

```bash
# Linting
npm run lint

# Tests
npm test

# Build
npm run build

# Validación de configuración
./scripts/validate-stock-config.sh
```

## 📞 Soporte

### Documentación

- [Spec RF-002](../specs/003-stock-integration/spec.md)
- [Plan de Implementación](../specs/003-stock-integration/plan.md)
- [Tasks Detallados](../specs/003-stock-integration/tasks.md)

### Issues

Reportar issues en el repositorio del proyecto.

### Contacto

- **Equipo**: Backend Team
- **Responsable**: [Nombre del responsable]
- **Email**: [email@example.com]

---

**Última actualización**: 2025-01-17
**Versión**: 1.0.0
