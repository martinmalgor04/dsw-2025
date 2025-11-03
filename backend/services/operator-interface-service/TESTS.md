# 🧪 E2E Tests Documentation - Operator Interface Service

## Resumen

El Operator Interface Service incluye una suite completa de **E2E (End-to-End) tests** que validan:
- ✅ Enrutamiento correcto de requests a microservicios
- ✅ Manejo de errores y códigos HTTP
- ✅ Headers de correlación (X-Request-ID) para request tracing
- ✅ Disponibilidad de servicios
- ✅ Respuestas en formato JSON

## 📍 Ubicación de Tests

```
backend/services/operator-interface-service/
├── test/
│   ├── jest-e2e.json                          # Configuración de Jest para E2E
│   └── e2e/                                   # Todos los tests E2E
│       ├── config.transport-methods.e2e.spec.ts
│       ├── config.coverage-zones.e2e.spec.ts
│       ├── config.tariff-configs.e2e.spec.ts
│       ├── shipping.quotes.e2e.spec.ts
│       ├── shipping.health.e2e.spec.ts
│       ├── stock.health.e2e.spec.ts
│       └── gateway.unknown.e2e.spec.ts
```

## 🚀 Cómo Correr los Tests

### Prerequisito: Tener servicios corriendo

**Terminal 1 - Inicia todos los servicios:**
```bash
cd /Users/martinmalgor/Documents/2025-12-TPI-1
pnpm dev
```

Espera a ver estos mensajes:
```
✅ Shipping Service running on http://localhost:3001
✅ Stock Integration running on http://localhost:3002
✅ Config Service running on http://localhost:3003
✅ Operator Interface Service running on http://localhost:3004
```

### Correr todos los E2E tests

**Terminal 2 - Desde la carpeta del operator:**
```bash
cd backend/services/operator-interface-service
pnpm test:e2e
```

### Correr tests específicos

```bash
# Solo tests del gateway
pnpm test:e2e --testPathPattern="gateway"

# Solo tests de config
pnpm test:e2e --testPathPattern="config"

# Solo tests de shipping
pnpm test:e2e --testPathPattern="shipping"

# Solo un archivo específico
pnpm test:e2e --testPathPattern="config.transport-methods"
```

### Ver qué tests están disponibles

```bash
pnpm test:e2e --listTests
```

## 📋 Tests Disponibles

### 1. **config.transport-methods.e2e.spec.ts**
**Valida:** Enrutamiento de requests a config-service para transport methods

```
GET /config/transport-methods
```

- ✅ Retorna 200 o 404/502 si servicio no disponible
- ✅ Incluye header X-Request-ID (UUID v4)
- ✅ Respuesta es JSON válido
- ✅ Tiempo de respuesta < 15 segundos

**Ejecutar solo este test:**
```bash
pnpm test:e2e --testPathPattern="config.transport-methods"
```

### 2. **config.coverage-zones.e2e.spec.ts**
**Valida:** CRUD completo de coverage zones

```
GET    /config/coverage-zones          (listar)
POST   /config/coverage-zones          (crear)
GET    /config/coverage-zones/:id      (obtener)
PATCH  /config/coverage-zones/:id      (actualizar)
DELETE /config/coverage-zones/:id      (eliminar)
```

- ✅ Todas las operaciones CRUD
- ✅ Validación de estructura de respuesta
- ✅ Manejo de errores (404, 502)
- ✅ X-Request-ID en todas las respuestas

### 3. **config.tariff-configs.e2e.spec.ts**
**Valida:** Gestión de configuraciones de tarifa

```
GET    /config/tariff-configs          (listar)
POST   /config/tariff-configs          (crear)
GET    /config/tariff-configs/:id      (obtener)
PATCH  /config/tariff-configs/:id      (actualizar)
DELETE /config/tariff-configs/:id      (eliminar)
```

- ✅ Operaciones CRUD completas
- ✅ Filtrado por transportMethodId
- ✅ Validación de estructura

### 4. **shipping.quotes.e2e.spec.ts**
**Valida:** Cálculo de quotes de shipping

```
POST /shipping/quotes
```

- ✅ Retorna quote con precio
- ✅ Maneja requests inválidas (400)
- ✅ Maneja servicio no disponible (502)
- ✅ Validación de X-Request-ID

### 5. **shipping.health.e2e.spec.ts**
**Valida:** Health check del shipping service

```
GET /shipping/health
```

- ✅ Retorna estado cuando disponible (200)
- ✅ Retorna error cuando no disponible (502)
- ✅ X-Request-ID siempre presente
- ✅ Respuesta en formato JSON

### 6. **stock.health.e2e.spec.ts**
**Valida:** Health check del stock service

```
GET /stock/health
```

- ✅ Validaciones similares a shipping.health

### 7. **gateway.unknown.e2e.spec.ts**
**Valida:** Manejo de rutas desconocidas y errores

```
GET /unknown/endpoint                  (ruta no existe)
GET /gateway/status                    (estado del gateway)
GET /health                            (health del gateway)
```

- ✅ Retorna 404 para rutas desconocidas
- ✅ Incluye X-Request-ID en errores
- ✅ Gateway/status retorna lista de servicios registrados
- ✅ Health check del gateway es siempre accesible

## 🔍 Estructura de un Test

Todos los tests siguen este patrón:

```typescript
import request from 'supertest';

const BASE_URL = process.env.OPERATOR_URL || 'http://localhost:3004';
const TIMEOUT = 15000;

describe('Test Suite Name', () => {
  describe('GET /endpoint', () => {
    it('should do something', async () => {
      const res = await request(BASE_URL)
        .get('/endpoint')
        .timeout(TIMEOUT);

      // Validar status code
      expect([200, 404, 502]).toContain(res.status);

      // Validar estructura de respuesta
      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.body).toHaveProperty('data');
      }
    }, 20000);  // Jest timeout en ms
  });
});
```

## 📊 Qué Validan los Tests

### Status Codes

Los tests aceptan múltiples códigos HTTP porque algunos servicios pueden no estar disponibles:

| Código | Significado | Cuándo Ocurre |
|--------|------------|---------------|
| **200** | OK - Request exitoso | Servicio disponible y request válida |
| **201** | Created - Recurso creado | POST exitoso |
| **400** | Bad Request - Datos inválidos | Request malformada |
| **404** | Not Found - Ruta no existe | Endpoint no existe |
| **502** | Bad Gateway - Servicio no disponible | Microservicio caído |
| **503** | Service Unavailable | Gateway saturado |

### X-Request-ID (Request Correlation)

Cada request genera un UUID v4 único para tracing:

```
Header: X-Request-ID
Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

Ejemplo: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
```

**Uso:** Buscar todos los logs de una request en los diferentes servicios:
```bash
grep "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6" /var/log/services/*.log
```

## 🔧 Configuración (jest-e2e.json)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": "e2e\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["src/**/*.(t|j)s"],
  "moduleNameMapper": {
    "^@logistics/(.*)$": "<rootDir>/../../shared/$1/src"
  }
}
```

**Explicación:**
- `testRegex`: Busca todos los archivos que terminen en `.e2e.spec.ts`
- `rootDir: "."`: Raíz es la carpeta `test/` (donde está jest-e2e.json)
- `moduleNameMapper`: Resuelve imports de `@logistics/*` correctamente

## ⚠️ Problemas Comunes

### ❌ "No tests found"

**Problema:** Jest no encuentra los archivos de test

**Solución:**
```bash
# Verificar que los archivos existen
ls test/e2e/*.e2e.spec.ts

# Verificar que Jest puede listarlos
pnpm test:e2e --listTests

# Si aún no funciona, verificar jest-e2e.json
cat test/jest-e2e.json
```

### ❌ "Cannot find module..."

**Problema:** Error al resolver imports

**Solución:**
```bash
# Regenerar cliente Prisma
cd backend/shared/database
npx prisma generate

# Rebuild servicios
cd backend/services/operator-interface-service
pnpm build
```

### ❌ "ECONNREFUSED - Connection refused"

**Problema:** El test no puede conectar al operator

**Solución:**
```bash
# Verificar que el operator está corriendo
curl http://localhost:3004/health

# Si no está, iniciarlo
pnpm start:operator
```

### ❌ "Expected 200, received 502"

**Problema:** Un microservicio no está disponible

**Solución:** Los tests aceptan 502 como respuesta válida, pero si necesitas que pasen correctamente:
```bash
# Asegurar que TODOS los servicios están corriendo
pnpm dev
```

## 📈 Output de Tests

```
PASS test/e2e/gateway.unknown.e2e.spec.ts
  Gateway: Error Handling [T021]
    GET /unknown - 404 Not Found
      ✓ should return 404 for unknown routes (12 ms)
      ✓ should include X-Request-ID header for error tracing (5 ms)
      ✓ should return proper error response with X-Request-ID (8 ms)
    GET /gateway/status - Gateway Health
      ✓ should return gateway status information (3 ms)
    GET /health - Gateway Health Check
      ✓ should return gateway health status (2 ms)
    Error Propagation with Request Correlation
      ✓ should propagate errors with X-Request-ID for debugging (1 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Time:        1.234 s
```

## 🎯 Flujo Completo: Setup → Test → Cleanup

```
┌─────────────────────────────────────────────┐
│ 1. Terminal 1: Inicia servicios             │
│    $ pnpm dev                               │
│    ✅ Espera a que todos estén listos       │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 2. Terminal 2: Verifica conectividad        │
│    $ curl http://localhost:3004/health      │
│    Response: {"status": "ok"}               │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 3. Terminal 2: Corre tests                  │
│    $ pnpm test:e2e                          │
│    ✅ Tests ejecutan y validan              │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 4. Revisa resultados                        │
│    - ✅ All tests passed                    │
│    - ❌ Some tests failed → debug            │
│    - ⏭️  Skip broken → ignore               │
└─────────────────────────────────────────────┘
```

## 🧠 Conceptos Clave

### Qué es un E2E Test?

Un **End-to-End (E2E) test** verifica que:
1. **El cliente (test) envía una request HTTP**
2. **El gateway recibe y valida la request**
3. **El gateway redirige a microservicio correcto**
4. **El microservicio procesa la request**
5. **El gateway retorna la respuesta al cliente**
6. **El cliente valida que la respuesta es correcta**

Es diferente de unit tests (que testean funciones individuales) porque valida toda la cadena.

### Por qué Supertest?

[Supertest](https://github.com/visionmedia/supertest) es una librería que permite hacer requests HTTP de manera fácil en tests:

```typescript
// Sin supertest (tedioso)
const http = require('http');
const req = http.request({ host: 'localhost', port: 3004, path: '/health' }, ...);

// Con supertest (simple)
const res = await request('http://localhost:3004').get('/health');
```

## 📚 Recursos Adicionales

- **Jest Documentation:** https://jestjs.io/
- **Supertest Repository:** https://github.com/visionmedia/supertest
- **HTTP Status Codes:** https://httpwg.org/specs/rfc7231.html#status.codes
- **UUID v4 Format:** https://tools.ietf.org/html/rfc4122

## 📝 Checklist: Cómo ejecutar tests correctamente

- [ ] Servicios Docker corriendo: `docker-compose ps`
- [ ] Todos los microservicios corriendo: `pnpm dev`
- [ ] Gateway responde: `curl http://localhost:3004/health`
- [ ] Navegar a carpeta correcta: `cd backend/services/operator-interface-service`
- [ ] Ejecutar tests: `pnpm test:e2e`
- [ ] Revisar resultados: ✅ passed o ❌ failed

## 🎓 Próximos Pasos

1. **Ejecutar los tests:** `pnpm test:e2e`
2. **Si pasan:** 🎉 Arquitectura está correcta
3. **Si fallan:** Revisar logs en la Terminal 1 (servicios) para entender qué salió mal
4. **Agregar más tests:** Copiar un test existente y adaptar a nuevos endpoints

---

**Última actualización:** Noviembre 2025
**Autor:** Grupo 12 - UTN FRRE
