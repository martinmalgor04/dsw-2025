# Troubleshooting - Stock Integration Module

Esta guía te ayudará a diagnosticar y resolver problemas comunes con el módulo de integración con Stock.

## 🚨 Problemas Comunes

### 1. Circuit Breaker Abierto

**Síntomas:**
- Errores: "Stock service unavailable - circuit breaker is open"
- Respuestas con productos por defecto
- Logs: "Circuit breaker is OPEN"

**Diagnóstico:**
```bash
# Verificar estado del circuit breaker
curl http://localhost:3000/health | jq '.circuitBreaker'

# Verificar logs
npm run start:dev | grep "Circuit breaker"
```

**Solución:**
```bash
# El circuit breaker se resetea automáticamente tras 30 segundos
# Para resetear manualmente (solo en desarrollo):
curl -X POST http://localhost:3000/stock-integration/circuit-breaker/reset
```

**Prevención:**
- Verificar conectividad con Stock API
- Ajustar umbral del circuit breaker si es necesario
- Implementar health checks más robustos

---

### 2. Errores de Autenticación

**Síntomas:**
- Errores 401/403 de Stock API
- Logs: "Authentication failed"
- Tokens JWT inválidos

**Diagnóstico:**
```bash
# Verificar configuración de Keycloak
./scripts/validate-stock-config.sh

# Verificar conectividad con Keycloak
curl -I https://keycloak.example.com/realms/ds-2025-realm

# Verificar token manualmente
curl -X POST https://keycloak.example.com/realms/ds-2025-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=logistica-service&client_secret=your-secret"
```

**Solución:**
```bash
# 1. Verificar variables de entorno
cat .env | grep KEYCLOAK

# 2. Actualizar configuración
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=ds-2025-realm
KEYCLOAK_CLIENT_ID=logistica-service
KEYCLOAK_CLIENT_SECRET=your-client-secret

# 3. Reiniciar aplicación
npm run start:dev
```

**Prevención:**
- Configurar refresh automático de tokens
- Implementar cache de tokens
- Monitorear expiración de tokens

---

### 3. Problemas de Caché

**Síntomas:**
- Respuestas lentas
- Datos inconsistentes
- Logs: "Cache error"

**Diagnóstico:**
```bash
# Verificar health check del caché
curl http://localhost:3000/health | jq '.cache'

# Verificar logs de caché
npm run start:dev | grep "Cache"

# Verificar memoria del proceso
ps aux | grep node
```

**Solución:**
```bash
# Limpiar caché
curl -X DELETE http://localhost:3000/stock-integration/cache/clear

# Reiniciar aplicación
npm run start:dev

# Ajustar configuración de caché
STOCK_CACHE_TTL=300  # Reducir TTL
STOCK_CACHE_MAX_ITEMS=500  # Reducir límite
```

**Prevención:**
- Monitorear uso de memoria
- Implementar invalidación automática
- Configurar Redis para producción

---

### 4. Timeouts y Conectividad

**Síntomas:**
- Errores: "Request timeout"
- Logs: "ETIMEDOUT" o "ECONNREFUSED"
- Respuestas lentas

**Diagnóstico:**
```bash
# Verificar conectividad con Stock API
curl -I https://stock.ds.frre.utn.edu.ar/v1/health

# Verificar DNS
nslookup stock.ds.frre.utn.edu.ar

# Verificar latencia
ping stock.ds.frre.utn.edu.ar

# Verificar desde la aplicación
curl http://localhost:3000/stock-integration/health
```

**Solución:**
```bash
# Ajustar timeouts
STOCK_API_TIMEOUT=5000  # Aumentar timeout
STOCK_API_RETRY_ATTEMPTS=5  # Aumentar reintentos
STOCK_API_RETRY_DELAY=2000  # Aumentar delay

# Verificar firewall/proxy
# Contactar al administrador de red si es necesario
```

**Prevención:**
- Implementar health checks regulares
- Configurar timeouts apropiados
- Monitorear latencia de red

---

### 5. Errores de Validación de DTOs

**Síntomas:**
- Errores 400: "Validation failed"
- Logs: "Validation error"
- Datos malformados

**Diagnóstico:**
```bash
# Verificar logs de validación
npm run start:dev | grep "Validation"

# Verificar estructura de datos
curl -X POST http://localhost:3000/shipping/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{"products":[{"id":1,"quantity":1}],"delivery_address":{"postal_code":"H3500ABC"}}'
```

**Solución:**
```typescript
// Verificar estructura de DTOs
// Asegurar que los datos coincidan con las interfaces:

interface ProductRequest {
  id: number;
  quantity: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;  // Formato CPA: H3500ABC
  country: string;
}
```

**Prevención:**
- Validar datos en el frontend
- Usar DTOs consistentes
- Implementar tests de validación

---

### 6. Problemas de Performance

**Síntomas:**
- Respuestas lentas (>2 segundos)
- Alto uso de CPU/memoria
- Timeouts frecuentes

**Diagnóstico:**
```bash
# Verificar métricas de performance
curl http://localhost:3000/metrics

# Verificar uso de recursos
top -p $(pgrep node)

# Verificar logs de performance
npm run start:dev | grep "duration"
```

**Solución:**
```bash
# Optimizar configuración
STOCK_CACHE_TTL=1800  # Aumentar TTL
STOCK_CACHE_MAX_ITEMS=2000  # Aumentar límite

# Configurar Redis para producción
REDIS_HOST=redis-server
REDIS_PORT=6379

# Ajustar pool de conexiones HTTP
STOCK_API_TIMEOUT=3000
STOCK_API_RETRY_ATTEMPTS=2
```

**Prevención:**
- Implementar métricas de performance
- Configurar alertas
- Optimizar queries y caché

---

## 🔍 Herramientas de Diagnóstico

### 1. Health Check Completo

```bash
#!/bin/bash
# health-check.sh

echo "🔍 Verificando salud del sistema..."

# 1. Aplicación
echo "📱 Aplicación:"
curl -s http://localhost:3000/health | jq '.'

# 2. Stock Integration
echo "📦 Stock Integration:"
curl -s http://localhost:3000/stock-integration/health | jq '.'

# 3. Circuit Breaker
echo "⚡ Circuit Breaker:"
curl -s http://localhost:3000/stock-integration/circuit-breaker/stats | jq '.'

# 4. Cache
echo "💾 Cache:"
curl -s http://localhost:3000/stock-integration/cache/stats | jq '.'

# 5. Conectividad
echo "🌐 Conectividad:"
curl -I https://stock.ds.frre.utn.edu.ar/v1/health
```

### 2. Logs en Tiempo Real

```bash
# Filtrar logs de Stock Integration
npm run start:dev | grep -E "(StockIntegration|CircuitBreaker|Cache)"

# Logs con colores
npm run start:dev | grep --color=always -E "(ERROR|WARN|INFO)"

# Logs estructurados
npm run start:dev | jq '.'
```

### 3. Métricas de Performance

```bash
# Verificar métricas
curl http://localhost:3000/metrics/stock-integration

# Exportar métricas para análisis
curl http://localhost:3000/metrics/stock-integration > metrics.json
```

---

## 🛠️ Comandos Útiles

### Reset y Limpieza

```bash
# Resetear circuit breaker
curl -X POST http://localhost:3000/stock-integration/circuit-breaker/reset

# Limpiar caché
curl -X DELETE http://localhost:3000/stock-integration/cache/clear

# Reiniciar aplicación
npm run start:dev

# Limpiar logs
> logs/app.log
```

### Testing de Conectividad

```bash
# Test de Stock API
curl -X GET https://stock.ds.frre.utn.edu.ar/v1/productos/1 \
  -H "Authorization: Bearer $(cat token.txt)"

# Test de Keycloak
curl -X POST https://keycloak.example.com/realms/ds-2025-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=logistica-service&client_secret=your-secret"

# Test de Redis (si está configurado)
redis-cli ping
```

### Validación de Configuración

```bash
# Validar configuración completa
./scripts/validate-stock-config.sh

# Validar solo variables de entorno
./scripts/validate-stock-config.sh | grep -E "(✅|❌)"

# Validar conectividad
./scripts/validate-stock-config.sh | grep -E "(alcanzable|conectividad)"
```

---

## 📊 Monitoreo y Alertas

### Métricas Clave

```typescript
// Métricas a monitorear
interface StockIntegrationMetrics {
  // Performance
  requestDuration: number;        // Latencia promedio
  requestThroughput: number;      // Requests por segundo
  
  // Reliability
  successRate: number;            // Tasa de éxito
  errorRate: number;              // Tasa de error
  
  // Circuit Breaker
  circuitBreakerState: string;    // CLOSED/OPEN/HALF_OPEN
  circuitBreakerFailures: number; // Fallos consecutivos
  
  // Cache
  cacheHitRate: number;           // Hit rate del caché
  cacheSize: number;              // Tamaño del caché
  
  // External Dependencies
  stockApiLatency: number;        // Latencia de Stock API
  keycloakLatency: number;        // Latencia de Keycloak
}
```

### Alertas Recomendadas

```yaml
# Ejemplo de configuración de alertas
alerts:
  - name: "Circuit Breaker Open"
    condition: "circuit_breaker_state == 'OPEN'"
    severity: "critical"
    
  - name: "High Error Rate"
    condition: "error_rate > 0.1"
    severity: "warning"
    
  - name: "High Latency"
    condition: "request_duration > 2000"
    severity: "warning"
    
  - name: "Low Cache Hit Rate"
    condition: "cache_hit_rate < 0.8"
    severity: "info"
```

---

## 🆘 Escalación

### Niveles de Soporte

1. **Nivel 1**: Problemas de configuración y conectividad básica
2. **Nivel 2**: Problemas de integración y performance
3. **Nivel 3**: Problemas de infraestructura y dependencias externas

### Información para Reportar

```bash
# Recopilar información del sistema
echo "=== System Info ===" > debug-info.txt
echo "Date: $(date)" >> debug-info.txt
echo "Node Version: $(node --version)" >> debug-info.txt
echo "NPM Version: $(npm --version)" >> debug-info.txt
echo "" >> debug-info.txt

echo "=== Configuration ===" >> debug-info.txt
./scripts/validate-stock-config.sh >> debug-info.txt
echo "" >> debug-info.txt

echo "=== Health Check ===" >> debug-info.txt
curl -s http://localhost:3000/health >> debug-info.txt
echo "" >> debug-info.txt

echo "=== Logs (last 100 lines) ===" >> debug-info.txt
tail -n 100 logs/app.log >> debug-info.txt
```

### Contactos

- **Equipo Backend**: [email@example.com]
- **DevOps**: [devops@example.com]
- **Stock API Team**: [stock-team@example.com]
- **Keycloak Admin**: [keycloak-admin@example.com]

---

**Última actualización**: 2025-01-17
**Versión**: 1.0.0
