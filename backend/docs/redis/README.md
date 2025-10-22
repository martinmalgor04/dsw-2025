# 🔴 Redis - Configuración y Uso

## 📋 Visión General

Redis se usa en el proyecto para caché de productos y distancias en el servicio de cotización (RF-003), optimizando el rendimiento y reduciendo llamadas a APIs externas.

## 🚀 Instalación Local

### Opción 1: Docker (Recomendado)

```bash
# Pull de la imagen oficial
docker pull redis:alpine

# Correr Redis en container
docker run --name logistica-redis \
  -p 6379:6379 \
  -d redis:alpine

# Verificar que esté corriendo
docker ps | grep logistica-redis
```

### Opción 2: Docker Compose

Ya está incluido en `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:alpine
    container_name: logistica-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-data:
```

**Comando:**
```bash
docker-compose up -d redis
```

### Opción 3: Instalación Local (macOS)

```bash
# Usando Homebrew
brew install redis

# Iniciar Redis
brew services start redis

# Verificar que esté corriendo
redis-cli ping
# Respuesta esperada: PONG
```

### Opción 4: Instalación Local (Linux - Ubuntu/Debian)

```bash
# Instalar Redis
sudo apt update
sudo apt install redis-server

# Iniciar servicio
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verificar estado
sudo systemctl status redis-server

# Test de conexión
redis-cli ping
```

## ⚙️ Configuración del Proyecto

### Variables de Entorno

Agregar en `backend/.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache TTL
PRODUCT_CACHE_TTL=600      # 10 minutos
DISTANCE_CACHE_TTL=3600    # 1 hora
STOCK_CACHE_TTL=600        # 10 minutos
```

### Redis con Autenticación (Producción)

Si usas Redis con password:

```env
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
```

### Redis Cloud (Producción)

Para servicios como Redis Cloud, Railway, Upstash:

```env
REDIS_URL=redis://default:password@host:port/0
```

## 🧪 Verificar Conexión

### Desde la Terminal

```bash
# Conectar al CLI de Redis
redis-cli

# Comandos útiles
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> INFO server
# Muestra información del servidor

127.0.0.1:6379> DBSIZE
# Cantidad de keys en la DB

127.0.0.1:6379> KEYS *
# Listar todas las keys (solo en dev)

127.0.0.1:6379> exit
```

### Desde el Backend

```bash
# Ejecutar health check
curl http://localhost:3000/health

# Respuesta esperada incluye:
{
  "status": "ok",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy"  // ✅ Verificar que esté healthy
  }
}
```

## 📊 Uso en el Proyecto

### Estructura de Keys

El proyecto usa estas keys de caché:

```
quote:product:{productId}           # Cache de productos desde Stock API
quote:distance:{postalA}:{postalB}  # Cache de distancias calculadas
stock:product:{productId}           # Cache de Stock Integration (RF-002)
stock:reserva:compra:{compraId}:{userId}  # Cache de reservas
stock:reserva:id:{reservaId}:{userId}     # Cache de reservas por ID
```

### TTL (Time To Live)

- **Productos**: 10 minutos (600s)
- **Distancias**: 1 hora (3600s)
- **Reservas**: 5 minutos (300s)

### Servicios que Usan Redis

1. **QuoteCacheService** (RF-003)
   - Caché de productos
   - Caché de distancias

2. **StockCacheService** (RF-002)
   - Caché de productos desde Stock API
   - Caché de reservas

## 🔍 Monitoreo y Debugging

### Ver Keys en Uso

```bash
redis-cli
127.0.0.1:6379> KEYS quote:*
127.0.0.1:6379> KEYS stock:*
```

### Ver Valor de una Key

```bash
127.0.0.1:6379> GET quote:product:123
# Muestra el JSON del producto cacheado
```

### Ver TTL de una Key

```bash
127.0.0.1:6379> TTL quote:product:123
# Retorna segundos restantes hasta expiración
```

### Limpiar Caché

```bash
# Limpiar todas las keys
redis-cli FLUSHDB

# Limpiar keys específicas
redis-cli DEL quote:product:123

# Limpiar por patrón
redis-cli --scan --pattern "quote:*" | xargs redis-cli DEL
```

## 📈 Monitoreo de Performance

### Redis CLI Monitor

Ver comandos en tiempo real:

```bash
redis-cli MONITOR
# Presiona Ctrl+C para salir
```

### Estadísticas

```bash
redis-cli INFO stats

# Métricas importantes:
# - total_connections_received
# - total_commands_processed
# - keyspace_hits / keyspace_misses (hit rate)
# - used_memory_human
```

### Hit Rate del Caché

```bash
redis-cli INFO stats | grep keyspace

# Calcular hit rate:
# hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses) * 100
```

## 🚨 Troubleshooting

### Redis no se conecta

**Error**: `ECONNREFUSED 127.0.0.1:6379`

**Solución**:
```bash
# Verificar que Redis esté corriendo
docker ps | grep redis
# o
brew services list | grep redis
# o
sudo systemctl status redis

# Si no está corriendo, iniciarlo
docker-compose up -d redis
# o
brew services start redis
```

### Performance degradada

**Síntomas**: Aplicación lenta con Redis activo

**Soluciones**:
```bash
# 1. Verificar memoria usada
redis-cli INFO memory | grep used_memory_human

# 2. Verificar cantidad de keys
redis-cli DBSIZE

# 3. Si hay demasiadas keys, limpiar
redis-cli FLUSHDB

# 4. Ajustar TTL en .env si es necesario
```

### Cache Fallback

La aplicación funciona **sin Redis** usando caché en memoria:

```typescript
// QuoteCacheModule usa fallback automático
store: 'memory', // Si Redis no está disponible
```

## 🔒 Seguridad (Producción)

### Configurar Password

```bash
# En redis.conf
requirepass your-secure-password

# O al iniciar Redis
redis-server --requirepass your-secure-password
```

### Limitar Acceso por IP

```bash
# En redis.conf
bind 127.0.0.1 ::1

# Solo permite conexiones desde localhost
```

### Deshabilitar Comandos Peligrosos

```bash
# En redis.conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""
```

## 📚 Recursos Adicionales

- [Redis Official Docs](https://redis.io/docs/)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Redis Commands Reference](https://redis.io/commands/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

## 🎯 Checklist de Setup

- [ ] Redis instalado o container corriendo
- [ ] Puerto 6379 accesible
- [ ] Variables de entorno configuradas en `.env`
- [ ] Health check pasa: `curl localhost:3000/health`
- [ ] Logs del backend muestran "Cache HIT/MISS"
- [ ] Redis CLI responde con PONG: `redis-cli ping`

---

**Última actualización**: 2025-10-18  
**Versión Redis recomendada**: 7.x (alpine)  
**Mantenido por**: Grupo 12 - UTN FRRE

