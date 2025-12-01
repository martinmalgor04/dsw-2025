# Tests de Integración - Stock Integration Service

## 📋 Descripción

Este directorio contiene tests de integración completos para el Stock Integration Service. Estos tests validan:

- ✅ Endpoints HTTP (GET /, GET /health)
- ✅ Integración con API externa de Stock (usando nock para mockear)
- ✅ Circuit Breaker en diferentes estados (CLOSED, OPEN, HALF_OPEN)
- ✅ Sistema de cache (get, set, delete)
- ✅ Lógica de reintentos automáticos
- ✅ Manejo de errores (404, 500, timeout, connection refused)
- ✅ Health checks del servicio
- ✅ Performance y concurrencia

## 🚀 Ejecutar Tests

### Todos los tests de integración

```bash
cd backend/services/stock-integration-service
pnpm test:integration
```

### Un archivo específico

```bash
pnpm test:integration stock-integration.integration.spec.ts
```

### Con coverage

```bash
pnpm test:integration --coverage
```

### En modo watch

```bash
pnpm test:integration --watch
```

## 📁 Estructura

```
test/integration/
├── stock-integration.integration.spec.ts  # Tests principales de integración
└── README.md                               # Este archivo
```

## 🧪 Cobertura de Tests

Los tests cubren:

### Endpoints HTTP
- `GET /` - Información del servicio
- `GET /health` - Health check

### Funcionalidades del Servicio
- `getProductById()` - Obtener producto por ID
- `getReservaByCompraId()` - Obtener reserva por ID de compra
- `getReservaById()` - Obtener reserva por ID
- `updateReservaStatus()` - Actualizar estado de reserva
- `getAndUpdateReservaStatus()` - Obtener y actualizar reserva

### Circuit Breaker
- Transición CLOSED → OPEN después de fallos
- Transición OPEN → HALF_OPEN después de timeout
- Transición HALF_OPEN → CLOSED en éxito
- Protección cuando está OPEN

### Cache
- Cache de productos
- Cache de reservas
- Invalidación de cache después de actualizaciones

### Retries
- Reintentos en errores de red
- Reintentos en errores 5xx
- Exponential backoff

### Error Handling
- Manejo de 404 (Not Found)
- Manejo de 500 (Internal Server Error)
- Manejo de timeouts
- Manejo de connection refused

## 🔧 Configuración

Los tests usan:
- **nock** para mockear llamadas HTTP a la API externa
- **supertest** para testear endpoints HTTP
- **Jest** como framework de testing

### Variables de Entorno

Los tests usan la configuración por defecto o pueden usar un archivo `.env.test`:

```bash
STOCK_API_URL=https://stock.ds.frre.utn.edu.ar/v1
STOCK_API_TIMEOUT=2000
STOCK_API_RETRY_ATTEMPTS=3
STOCK_API_RETRY_DELAY=1000
STOCK_CIRCUIT_BREAKER_THRESHOLD=5
STOCK_CIRCUIT_BREAKER_TIMEOUT=30000
```

## 📊 Ejemplo de Ejecución

```bash
$ pnpm test:integration

 PASS  test/integration/stock-integration.integration.spec.ts
  Stock Integration Service - Integration Tests
    HTTP Endpoints
      GET /
        ✓ should return service information (45ms)
        ✓ should include port information (12ms)
      GET /health
        ✓ should return health status (15ms)
        ✓ should include environment information (8ms)
    Product Integration
      getProductById - Success
        ✓ should retrieve product from external API (123ms)
        ✓ should cache product after retrieval (98ms)
        ✓ should return cached product if available (5ms)
      getProductById - Circuit Breaker Protection
        ✓ should return default product when circuit breaker is OPEN (3ms)
        ✓ should record failure when API request fails (45ms)
      getProductById - Retry Logic
        ✓ should retry on network errors (234ms)
        ✓ should retry on 5xx errors (456ms)
        ✓ should return default product after max retries (789ms)
    ...
    
Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
Time:        12.345 s
```

## 🐛 Troubleshooting

### Error: "nock: No match for request"

Esto significa que nock no está mockeando correctamente la URL. Verifica:
1. Que la URL base coincida exactamente con `STOCK_API_URL`
2. Que el path sea correcto
3. Que no haya otros mocks interfiriendo

### Error: "Circuit breaker is OPEN"

Los tests resetean el circuit breaker antes de cada test, pero si falla:
1. Verifica que `circuitBreaker.reset()` se ejecute en `beforeEach`
2. Verifica que no haya tests anteriores que dejen el circuit breaker en estado OPEN

### Tests lentos

Los tests de retry pueden ser lentos porque esperan delays. Para acelerar:
1. Reduce `STOCK_API_RETRY_DELAY` en `.env.test`
2. Usa `jest.useFakeTimers()` para tests de retry específicos

## 📝 Agregar Nuevos Tests

Para agregar nuevos tests de integración:

1. Crea un nuevo archivo `*.integration.spec.ts` en este directorio
2. Sigue la estructura de los tests existentes
3. Usa nock para mockear llamadas HTTP externas
4. Resetea el circuit breaker y cache en `beforeEach`
5. Limpia nock en `afterEach` o `beforeEach`

Ejemplo:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import nock from 'nock';
import { AppModule } from '../../src/app.module';
import { StockIntegrationService } from '../../src/services/stock-integration.service';

describe('Nueva Funcionalidad - Integration', () => {
  let service: StockIntegrationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    service = module.get<StockIntegrationService>(StockIntegrationService);
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  it('should test nueva funcionalidad', async () => {
    // Tu test aquí
  });
});
```

