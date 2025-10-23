# Plan de Implementación - RF-002: Integración con Stock

## 📋 **Resumen del Plan**

Este plan detalla la implementación del cliente HTTP para integración con la API de Stock, incluyendo circuit breaker, caché Redis, manejo de errores robusto y testing completo.

## 🎯 **Objetivos del Plan**

1. **Implementar cliente HTTP robusto** para Stock API
2. **Configurar circuit breaker** con umbral de 5 fallos
3. **Integrar caché Redis** con TTL de 10 minutos
4. **Desarrollar tests completos** (unitarios + integración)
5. **Configurar autenticación JWT** con Keycloak
6. **Integrar con servicios existentes** de RF-001

## 🏗️ **Arquitectura de Implementación**

### **Estructura de Módulos:**

```
backend/src/
├── stock-integration/
│   ├── stock-integration.module.ts
│   ├── services/
│   │   ├── stock-integration.service.ts
│   │   ├── stock-circuit-breaker.service.ts
│   │   └── stock-cache.service.ts
│   ├── dto/
│   │   ├── producto-stock.dto.ts
│   │   ├── reserva-stock.dto.ts
│   │   └── stock-error.dto.ts
│   ├── interfaces/
│   │   ├── stock-api.interface.ts
│   │   └── circuit-breaker.interface.ts
│   ├── guards/
│   │   └── stock-auth.guard.ts
│   ├── interceptors/
│   │   ├── stock-retry.interceptor.ts
│   │   └── stock-logging.interceptor.ts
│   └── __tests__/
│       ├── stock-integration.service.spec.ts
│       ├── stock-circuit-breaker.service.spec.ts
│       ├── stock-cache.service.spec.ts
│       └── integration/
│           └── stock-api.integration.spec.ts
```

## 📅 **Fases de Implementación**

### **Fase 1: Configuración Base (2 días)**

#### **Día 1: Setup Inicial**
- [ ] Crear estructura de módulos y carpetas
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias necesarias
- [ ] Configurar HttpModule de NestJS
- [ ] Setup básico de Redis

#### **Día 2: Configuración de Autenticación**
- [ ] Implementar servicio de autenticación JWT
- [ ] Configurar Keycloak client
- [ ] Crear guard de autenticación
- [ ] Implementar refresh automático de tokens

### **Fase 2: Servicios Core (3 días)**

#### **Día 3: Circuit Breaker Service**
- [ ] Implementar lógica de circuit breaker
- [ ] Estados: CLOSED, OPEN, HALF_OPEN
- [ ] Umbral de 5 fallos consecutivos
- [ ] Timeout de recuperación de 30 segundos
- [ ] Tests unitarios completos

#### **Día 4: Cache Service**
- [ ] Implementar servicio de caché Redis
- [ ] TTL de 10 minutos
- [ ] Claves estructuradas
- [ ] Invalidación automática
- [ ] Tests unitarios completos

#### **Día 5: Stock Integration Service**
- [ ] Implementar cliente HTTP principal
- [ ] Métodos para productos y reservas
- [ ] Integración con circuit breaker
- [ ] Integración con caché
- [ ] Manejo de errores robusto

### **Fase 3: DTOs e Interfaces (1 día)**

#### **Día 6: Modelos de Datos**
- [ ] Crear DTOs para ProductoStock
- [ ] Crear DTOs para ReservaStock
- [ ] Crear interfaces de API
- [ ] Validaciones con class-validator
- [ ] Documentación con Swagger

### **Fase 4: Interceptors y Guards (1 día)**

#### **Día 7: Middleware y Seguridad**
- [ ] Implementar interceptor de reintentos
- [ ] Implementar interceptor de logging
- [ ] Crear guard de autenticación
- [ ] Manejo de errores HTTP
- [ ] Logs estructurados

### **Fase 5: Testing (2 días)**

#### **Día 8: Tests Unitarios**
- [ ] Tests para StockIntegrationService
- [ ] Tests para StockCircuitBreakerService
- [ ] Tests para StockCacheService
- [ ] Mocks de respuestas de Stock API
- [ ] Cobertura > 90%

#### **Día 9: Tests de Integración**
- [ ] Tests con Stock API real (cuando esté disponible)
- [ ] Tests de autenticación
- [ ] Tests de circuit breaker
- [ ] Tests de caché
- [ ] Tests de manejo de errores

### **Fase 6: Integración y Documentación (1 día)**

#### **Día 10: Integración Final**
- [ ] Integrar con módulos existentes
- [ ] Actualizar app.module.ts
- [ ] Configurar variables de entorno
- [ ] Documentación de API
- [ ] README actualizado

## 🔧 **Configuración Técnica**

### **Dependencias a Instalar:**

```json
{
  "dependencies": {
    "@nestjs/axios": "^3.0.0",
    "@nestjs/cache-manager": "^2.1.0",
    "cache-manager-redis-store": "^3.0.1",
    "axios": "^1.6.0",
    "keycloak-connect": "^22.0.0",
    "nest-keycloak-connect": "^1.8.0"
  },
  "devDependencies": {
    "@types/keycloak-connect": "^12.0.0",
    "nock": "^13.4.0"
  }
}
```

### **Variables de Entorno:**

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

# Redis Configuration
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

## 🧪 **Estrategia de Testing**

### **Tests Unitarios:**

1. **StockIntegrationService**
   - Mock de HttpService
   - Mock de CircuitBreakerService
   - Mock de CacheService
   - Tests de todos los métodos públicos
   - Tests de manejo de errores

2. **StockCircuitBreakerService**
   - Tests de transiciones de estado
   - Tests de umbrales
   - Tests de timeouts
   - Tests de conteo de fallos

3. **StockCacheService**
   - Tests de operaciones CRUD
   - Tests de TTL
   - Tests de invalidación
   - Tests de límites

### **Tests de Integración:**

1. **Stock API Real**
   - Tests con endpoints reales
   - Tests de autenticación
   - Tests de respuestas válidas
   - Tests de manejo de errores HTTP

2. **Flujo Completo**
   - Tests end-to-end
   - Tests de performance
   - Tests de circuit breaker en acción
   - Tests de caché en acción

## 📊 **Métricas y Monitoreo**

### **Métricas a Implementar:**

1. **Performance**
   - Latencia de requests (p50, p95, p99)
   - Throughput de requests por segundo
   - Tiempo de respuesta del caché

2. **Reliability**
   - Tasa de éxito de requests
   - Estado del circuit breaker
   - Hit rate del caché

3. **Business**
   - Número de productos consultados
   - Número de reservas procesadas
   - Errores por tipo

### **Logs Estructurados:**

```typescript
// Ejemplo de logging estructurado
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

## 🔒 **Seguridad**

### **Autenticación JWT:**

1. **Configuración de Keycloak**
   - Client credentials flow
   - Scopes específicos
   - Refresh automático de tokens

2. **Manejo de Tokens**
   - Almacenamiento seguro
   - Refresh automático
   - Manejo de expiración

3. **Scopes Requeridos**
   - `productos:read`
   - `reservas:read`
   - `reservas:write`

## 🚀 **Integración con RF-001**

### **Modificaciones Necesarias:**

1. **ShippingService**
   - Integrar StockIntegrationService
   - Usar datos de productos para cálculos
   - Validar reservas antes de crear envíos

2. **CostCalculationService**
   - Obtener peso y dimensiones de productos
   - Calcular volumen total
   - Aplicar tarifas basadas en datos reales

3. **TransportMethodsService**
   - Validar disponibilidad de transportes
   - Aplicar restricciones por peso/volumen

## 📋 **Criterios de Aceptación**

### **Funcionalidad:**
- [ ] Cliente HTTP funcional con Stock API
- [ ] Circuit breaker operativo
- [ ] Caché Redis funcionando
- [ ] Autenticación JWT configurada
- [ ] Manejo de errores robusto

### **Performance:**
- [ ] Latencia < 500ms (con caché)
- [ ] Hit rate de caché > 80%
- [ ] Circuit breaker se activa correctamente
- [ ] Reintentos funcionando

### **Testing:**
- [ ] Cobertura de tests > 90%
- [ ] Tests de integración funcionando
- [ ] Tests de circuit breaker
- [ ] Tests de caché

### **Documentación:**
- [ ] README actualizado
- [ ] Documentación de API
- [ ] Guías de troubleshooting
- [ ] Ejemplos de uso

## 🎯 **Entregables**

1. **Código Fuente**
   - Módulo completo de integración
   - Tests unitarios y de integración
   - Configuración de entorno

2. **Documentación**
   - README con instrucciones
   - Documentación de API
   - Guías de configuración

3. **Configuración**
   - Variables de entorno
   - Configuración de Redis
   - Configuración de Keycloak

4. **Testing**
   - Suite completa de tests
   - Mocks de Stock API
   - Tests de integración

## 🚨 **Riesgos y Mitigaciones**

### **Riesgos Identificados:**

1. **Stock API no disponible**
   - **Mitigación**: Fallbacks y valores por defecto
   - **Mitigación**: Circuit breaker para evitar cascadas

2. **Problemas de autenticación**
   - **Mitigación**: Refresh automático de tokens
   - **Mitigación**: Manejo robusto de errores 401/403

3. **Latencia alta de Stock API**
   - **Mitigación**: Caché Redis agresivo
   - **Mitigación**: Timeouts configurables

4. **Redis no disponible**
   - **Mitigación**: Fallback a memoria local
   - **Mitigación**: Degradación graceful

## 📈 **Métricas de Éxito**

1. **Técnicas**
   - Cobertura de tests > 90%
   - Latencia promedio < 500ms
   - Hit rate de caché > 80%
   - Uptime > 99.9%

2. **Funcionales**
   - Integración exitosa con Stock API
   - Circuit breaker funcionando
   - Autenticación JWT operativa
   - Manejo de errores robusto

3. **Operacionales**
   - Logs estructurados implementados
   - Métricas de monitoreo configuradas
   - Documentación completa
   - Tests de integración funcionando

---

**Nota**: Este plan está diseñado para ser ejecutado en 10 días hábiles, con entregables incrementales y testing continuo.
