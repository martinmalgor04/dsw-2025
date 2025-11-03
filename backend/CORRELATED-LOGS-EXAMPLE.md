# 📊 Ejemplo de Logs Correlacionados con X-Request-ID

Guía práctica para usar X-Request-ID para trazar requests distribuidos a través del gateway y microservicios.

## 🎯 Problema

En una arquitectura de microservicios, un único request del usuario pasa por varios servicios:

```
Frontend → Gateway → Config Service → (Podría ir a otro servicio)
```

Sin correlación, los logs se mezclan y es difícil trazar una request completa:

```
[Gateway]   GET /config/transport-methods
[Gateway]   🔄 Incoming request
[Config]    SELECT * FROM "TransportMethod"
[Gateway]   ✅ Response sent
[Config]    5 results found
[Gateway]   POST /config/tariff-configs
[Gateway]   🔄 Incoming request
[Config]    SELECT * FROM "TariffConfig"
```

¿Cuál log pertenece a cuál request? 😕

## ✨ Solución: X-Request-ID

Cada request obtiene un UUID único. Este ID se propaga a todos los servicios:

```
Frontend → Gateway → Config Service
  ↓            ↓            ↓
UUID ----→ UUID ----→ UUID (mismo en los tres)
```

## 📝 Ejemplo Práctico

### 1. Cliente hace una request

```bash
curl -v http://localhost:3004/config/transport-methods
```

### 2. Gateway genera X-Request-ID

El middleware `request-id.middleware.ts` genera automáticamente:

```typescript
// Genera UUID si no viene en headers
const requestId = req.headers['x-request-id'] || generateUUID();
// → a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6

res.setHeader('X-Request-ID', requestId);
```

### 3. Response incluye el ID

```
HTTP/1.1 200 OK
X-Request-ID: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
Content-Type: application/json
```

### 4. Los logs están correlacionados

**Terminal del Gateway** (`:3004`):
```json
{
  "timestamp": "2025-11-03T16:30:45.100Z",
  "level": "info",
  "message": "🔄 Incoming request",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "method": "GET",
  "path": "/config/transport-methods",
  "ip": "127.0.0.1"
}
{
  "timestamp": "2025-11-03T16:30:45.150Z",
  "level": "info",
  "message": "📤 GET http://localhost:3003/config/transport-methods (attempt 1/3)",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "serviceName": "config-service",
  "attempt": 1
}
{
  "timestamp": "2025-11-03T16:30:45.230Z",
  "level": "info",
  "message": "✅ GET http://localhost:3003/config/transport-methods → 200",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "serviceName": "config-service",
  "statusCode": 200,
  "durationMs": 80
}
{
  "timestamp": "2025-11-03T16:30:45.235Z",
  "level": "info",
  "message": "✅ Response sent",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "method": "GET",
  "path": "/config/transport-methods",
  "status": 200,
  "durationMs": 135
}
```

**Terminal del Config Service** (`:3003`):
```json
{
  "timestamp": "2025-11-03T16:30:45.160Z",
  "level": "info",
  "message": "🔄 Incoming request",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "method": "GET",
  "path": "/config/transport-methods",
  "ip": "127.0.0.1"
}
{
  "timestamp": "2025-11-03T16:30:45.200Z",
  "level": "info",
  "message": "Query executed",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "query": "SELECT * FROM \"TransportMethod\"",
  "rowsAffected": 5
}
{
  "timestamp": "2025-11-03T16:30:45.225Z",
  "level": "info",
  "message": "✅ Response sent",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "method": "GET",
  "path": "/config/transport-methods",
  "status": 200,
  "durationMs": 65
}
```

## 🔍 Buscar Logs de una Request

### En Desarrollo (Console)

```bash
# Copiar el X-Request-ID de la response
# X-Request-ID: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6

# Terminal 1 - Ver logs del gateway
pnpm start:dev | grep "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6"

# Terminal 2 - Ver logs del config service
cd backend/services/config-service
pnpm start:dev | grep "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6"
```

### Guardar X-Request-ID en Variable

```bash
# Hacer request y capturar ID
RESPONSE=$(curl -i http://localhost:3004/config/transport-methods 2>/dev/null)

# Extraer el ID del header
REQUEST_ID=$(echo "$RESPONSE" | grep -i "x-request-id" | awk '{print $2}' | tr -d '\r')

echo "Request ID: $REQUEST_ID"
# Output: Request ID: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6

# Ahora puedes buscar este ID
grep "$REQUEST_ID" logs.txt
```

## 📊 Caso de Uso Real: Debugging de Error

### Escenario: Error 502 en una request

```bash
# Usuario reporta: "Obtengo 502 cuando pido transport-methods"

# 1. Reproducir el error
curl http://localhost:3004/config/transport-methods -v

# Output:
# HTTP/1.1 502 Bad Gateway
# X-Request-ID: f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6
```

### 2. Buscar en logs con ese ID

**Gateway logs**:
```bash
grep "f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6" gateway.log

# Output:
# [16:45:23] 🔄 Incoming request ... requestId: f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6
# [16:45:23] 📤 GET http://localhost:3003/config/transport-methods ... requestId: f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6
# [16:45:25] ❌ Error: ECONNREFUSED localhost:3003 ... requestId: f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6
# [16:45:25] ⚠️  Reintentando... attempt 2/3 ... requestId: f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6
# [16:45:25] ❌ Circuit breaker OPEN for config-service ... requestId: f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6
# [16:45:25] 502 Bad Gateway ... requestId: f1e2d3c4-b5a6-47g8-h9i0-j1k2l3m4n5o6
```

**Conclusión**: Config Service no está corriendo → ECONNREFUSED

```bash
# Verificar status
curl http://localhost:3004/gateway/status | jq '.services[] | select(.name == "config-service")'

# Output:
# {
#   "name": "config-service",
#   "isHealthy": false,
#   "lastHealthCheck": "2025-11-03T16:45:20.123Z"
# }

# Reiniciar el servicio
cd backend/services/config-service
pnpm start:dev
```

## 🔗 Pasar X-Request-ID en Requests

### Desde el Frontend

```typescript
// src/app/lib/middleware/http/http-client.ts

const httpClient = {
  async request<T>(method: string, url: string, data?: any): Promise<T> {
    // Obtener o generar X-Request-ID
    const requestId = localStorage.getItem('current-request-id') || generateUUID();

    const response = await fetch(url, {
      method,
      headers: {
        'X-Request-ID': requestId,  // ← Pasar al backend
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    // El backend devuelve el mismo ID en la respuesta
    const responseRequestId = response.headers.get('X-Request-ID');

    // Guardar para debugging
    localStorage.setItem('last-request-id', responseRequestId);

    return response.json();
  },
};
```

### Desde Node.js (inter-servicio)

```typescript
// Si un microservicio hace request a otro

import axios from 'axios';

const makeRequest = (requestId: string) => {
  return axios.get('http://localhost:3003/config/transport-methods', {
    headers: {
      'X-Request-ID': requestId,  // ← Pasar el mismo ID
    },
  });
};
```

## 📈 Visualizar Request Flow con X-Request-ID

### Timeline de una Request

```
16:45:23.100 [Gateway] 🔄 Incoming request f1e2d3c4-b5a6...
                          ↓
16:45:23.120 [Gateway] 📤 Forwarding to config-service:3003
                          ↓
16:45:23.125 [Config]  🔄 Incoming request f1e2d3c4-b5a6...
                          ↓
16:45:23.150 [Config]  Query: SELECT * FROM "TransportMethod"
                          ↓
16:45:23.200 [Config]  ✅ Response 200 (75ms)
                          ↓
16:45:23.205 [Gateway] ✅ Received response from config-service
                          ↓
16:45:23.210 [Gateway] ✅ Response sent to client (110ms total)
```

### Total Latency

```
Frontend request
    ↓ (0ms)
Gateway recibe
    ↓ (2ms)
Gateway genera X-Request-ID
    ↓ (2ms)
Lookup en ServiceRegistry
    ↓ (5ms)
HTTP request a config-service:3003
    ↓ (80ms)
Config Service procesa
    ↓ (75ms)
Config Service retorna
    ↓ (5ms)
Gateway retorna al frontend
    ↓ (110ms total)
```

## 🛠️ Implementación en Tu Código

### Para loguear con X-Request-ID

```typescript
// En cualquier controller o servicio
import { Logger } from '@nestjs/common';
import { Request } from 'express';

@Controller('config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  @Get('transport-methods')
  async getTransportMethods(@Req() req: Request) {
    const requestId = req.get('x-request-id');

    this.logger.log(
      `[${requestId}] Fetching transport methods`,
    );

    const data = await this.service.getTransportMethods();

    this.logger.log(
      `[${requestId}] Found ${data.length} transport methods`,
    );

    return data;
  }
}
```

### Hacer que Prisma incluya X-Request-ID en logs

```typescript
// En prisma middleware

import { Prisma } from '@prisma/client';

const prismaMiddleware: Prisma.Middleware = async (params, next) => {
  const result = await next(params);

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      action: params.action,
      model: params.model,
      requestId: params.args?._requestId || 'N/A',
      durationMs: Date.now(),
    }),
  );

  return result;
};

prisma.$use(prismaMiddleware);
```

## 📝 Resumen

| Concepto | Descripción |
|----------|-------------|
| **X-Request-ID** | UUID único generado por el gateway |
| **Generación** | Automática en `request-id.middleware.ts` |
| **Propagación** | Se envía en response header |
| **Uso** | Buscar logs con `grep "uuid"` |
| **Debugging** | Correlaciona logs de múltiples servicios |
| **Performance** | También se registra `durationMs` para latencia |

## 🚀 Tips de Debugging

1. **Siempre copia el X-Request-ID** de la response cuando hay errores
2. **Busca ese ID en todos los servicios** para ver el flujo completo
3. **Revisa `durationMs`** para identificar qué servicio es lento
4. **Usa `| jq .`** para formatear JSON en console
5. **Setea timestamps en todos los logs** para saber el orden exacto

---

**Última actualización**: Noviembre 2025
**Autor**: Grupo 12 - UTN FRRE
