# 🔧 Guía de Operación - Backend Microservicios

Guía completa para operar, monitorear y troubleshootear el backend en desarrollo y producción.

## 📋 Tabla de Contenidos

1. [Setup Local](#setup-local)
2. [Iniciar Servicios](#iniciar-servicios)
3. [Monitorear](#monitorear)
4. [Troubleshooting](#troubleshooting)
5. [Database](#database)
6. [Deployment](#deployment)

---

## 🚀 Setup Local

### Requisitos Previos

```bash
# Node.js 18+ (recomendado 20+)
node --version

# pnpm (gestor de paquetes - MUY IMPORTANTE!)
pnpm --version
# Si no está instalado:
npm install -g pnpm

# Docker & Docker Compose (para servicios locales)
docker --version
docker-compose --version
```

### Setup Inicial (Una Sola Vez)

```bash
# 1. Navegar al proyecto
cd /Users/martinmalgor/Documents/2025-12-TPI-1

# 2. Instalar TODAS las dependencias (monorepo)
pnpm install:all

# 3. Iniciar servicios Docker (PostgreSQL, Redis, Keycloak)
docker-compose up -d

# 4. Esperar a que PostgreSQL esté listo (30 segundos)
sleep 30

# 5. Setup de base de datos
cd backend/shared/database
pnpm prisma migrate dev
pnpm prisma db seed

# 6. Volver a raíz y compilar paquetes compartidos
cd ../../../
pnpm build:shared
```

### Validar Setup

```bash
# Verificar servicios Docker
docker-compose ps

# Debería mostrar:
# - postgres    (status: Up)
# - redis       (status: Up)
# - keycloak    (status: Up)

# Verificar que puedes conectar a BD
psql postgresql://logistica:logistica123@localhost:5432/logistica_db -c "SELECT 1"

# Debería retornar: 1
```

---

## 🎯 Iniciar Servicios

### Desarrollo Local (Recomendado)

**Terminal 1 - Todos los servicios backend**:
```bash
cd /Users/martinmalgor/Documents/2025-12-TPI-1
pnpm dev
```

Esto inicia automáticamente:
- ✅ Operator Interface (Gateway) :3004
- ✅ Config Service :3003
- ✅ Shipping Service :3001
- ✅ Stock Integration Service :3002

Los servicios se reinician automáticamente cuando cambias el código (hot reload).

**Terminal 2 - Frontend**:
```bash
cd /Users/martinmalgor/Documents/2025-12-TPI-1/frontend
pnpm dev

# Abre http://localhost:3000
```

**Terminal 3 - Prisma Studio** (opcional, para inspeccionar BD):
```bash
cd /Users/martinmalgor/Documents/2025-12-TPI-1/backend/shared/database
pnpm prisma studio

# Abre http://localhost:5555
```

### Servicios Individuales

Si necesitas iniciar un solo servicio:

```bash
# Config Service (puerto 3003)
cd backend/services/config-service
pnpm start:dev

# Shipping Service (puerto 3001)
cd backend/services/shipping-service
pnpm start:dev

# Stock Integration Service (puerto 3002)
cd backend/services/stock-integration-service
pnpm start:dev

# Operator Interface Service (puerto 3004)
cd backend/services/operator-interface-service
pnpm start:dev
```

---

## 📊 Monitorear

### Health Checks Rápidos

```bash
# Gateway está vivo
curl http://localhost:3004/health

# Ver status de TODOS los microservicios
curl http://localhost:3004/gateway/status | jq .

# Cada servicio tiene su propio health endpoint
curl http://localhost:3003/health  # Config
curl http://localhost:3001/health  # Shipping
curl http://localhost:3002/health  # Stock
```

### Ver Logs

```bash
# Ver logs de TODO en tiempo real
pnpm dev

# Ver logs de un servicio específico
cd backend/services/operator-interface-service
pnpm start:dev

# Ver logs de Docker
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f keycloak
```

### Buscar Errores en Logs

```bash
# Error 502 - Service unavailable
grep "502\|Bad Gateway\|ECONNREFUSED" <logs>

# Circuit breaker abierto
grep "Circuit breaker OPEN\|unhealthy" <logs>

# Timeout
grep "TIMEOUT\|504\|timed out" <logs>

# Reintento fallido
grep "attempt \|retry\|Intento" <logs>
```

### Monitorear Requests con X-Request-ID

El gateway genera un **UUID único** para cada request (X-Request-ID):

```bash
# Hacer request y capturar request-id
REQUEST_ID=$(curl -s -I http://localhost:3004/config/transport-methods | grep -i "x-request-id" | awk '{print $2}' | tr -d '\r')

echo "Request ID: $REQUEST_ID"

# Buscar este ID en logs para trazar el request completo
grep "$REQUEST_ID" <logs>
```

---

## ⚠️ Troubleshooting

### "Port already in use"

```bash
# Encontrar qué proceso usa el puerto
lsof -i :3004

# Matar el proceso
kill -9 <PID>

# O usar puerto diferente
PORT=3005 pnpm start:dev
```

### "Connection refused" a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Si no está corriendo:
docker-compose up -d postgres

# Chequear string de conexión
echo $DATABASE_URL

# Test de conexión
psql $DATABASE_URL -c "SELECT 1"
```

### "Module not found" o TypeScript errors

```bash
# Limpiar todo
pnpm clean

# Reinstalar
pnpm install:all

# Compilar paquetes compartidos
pnpm build:shared

# Generar cliente Prisma
cd backend/shared/database
pnpm prisma generate

# Volver a intentar
cd ../../../
pnpm dev
```

### Gateway retorna 502 Bad Gateway

**Posibles causas**:

1. **Servicio downstream no está corriendo**:
   ```bash
   # Verificar servicios
   curl http://localhost:3004/gateway/status

   # Si muestra isHealthy: false, reiniciar el servicio
   cd backend/services/config-service
   pnpm start:dev
   ```

2. **Config service tarda demasiado**:
   ```bash
   # Ver timeout actual
   grep "CONFIG_SERVICE_TIMEOUT" .env

   # Aumentar timeout en .env
   CONFIG_SERVICE_TIMEOUT=10000
   ```

3. **Firewall bloqueando conexión interna**:
   ```bash
   # Verificar conectividad
   curl http://localhost:3003/health
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   ```

### "Timeout" esperando respuesta

```bash
# Aumentar timeout en .env
CONFIG_SERVICE_TIMEOUT=10000       # 10 segundos
SHIPPING_SERVICE_TIMEOUT=10000
STOCK_INTEGRATION_SERVICE_TIMEOUT=10000
```

### Frontend no puede conectar al gateway

```bash
# Verificar NEXT_PUBLIC_API_URL
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL

# Debería ser: http://localhost:3004

# Verificar que gateway está en 3004
curl http://localhost:3004/health

# Si cambió de puerto, actualizar .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3004" > frontend/.env.local
```

### Base de datos corrupta o desfasada

```bash
# ⚠️ CUIDADO: Esto elimina TODOS los datos

cd backend/shared/database

# Reset completo
pnpm prisma db reset

# Re-popula con datos de seed
# (automático con reset)

# Verificar
pnpm prisma studio
```

---

## 🗄️ Database

### Migraciones

```bash
cd backend/shared/database

# Ver status de migraciones
pnpm prisma migrate status

# Crear nueva migración después de cambiar schema.prisma
pnpm prisma migrate dev --name nombre_descriptivo

# Deployar migraciones en producción
pnpm prisma migrate deploy

# Ver historial de migraciones
pnpm prisma migrate history
```

### Inspeccionar BD

```bash
cd backend/shared/database

# Abrir editor visual (recomendado)
pnpm prisma studio

# O usar SQL directamente
psql $DATABASE_URL

# Ejemplos en psql:
# \dt               - Listar tablas
# SELECT * FROM "TransportMethod";  - Ver datos
# \q               - Salir
```

### Seeding (Datos de Prueba)

```bash
cd backend/shared/database

# Ejecutar seed
pnpm prisma db seed

# Editar seed en: prisma/seed.ts
# Luego ejecutar de nuevo
```

---

## 🚀 Deployment

### Pre-deployment Checklist

```bash
# 1. Compilar todo
pnpm build

# 2. Correr tests
pnpm test

# 3. Correr E2E tests
cd backend/services/operator-interface-service
pnpm test:e2e

# 4. Lint sin errores
pnpm lint

# 5. Verificar que no hay imports de Prisma en operator
grep -r "@logistics/database\|@prisma/client" \
  backend/services/operator-interface-service/src/

# (Debería retornar 0 resultados)
```

### Build para Producción

```bash
# Compilar todos los servicios
pnpm build

# Verificar que dist/ fue creado en cada servicio
ls backend/services/*/dist/main.js

# Debería haber 4 archivos main.js
```

### Iniciar en Producción

```bash
# Usar node directamente (no hot reload)
PORT=3004 NODE_ENV=production node backend/services/operator-interface-service/dist/main.js
PORT=3003 NODE_ENV=production node backend/services/config-service/dist/main.js
PORT=3001 NODE_ENV=production node backend/services/shipping-service/dist/main.js
PORT=3002 NODE_ENV=production node backend/services/stock-integration-service/dist/main.js

# O usar Docker (recomendado)
docker-compose -f docker-compose.prod.yml up
```

### Variables de Entorno en Producción

Crear `.env.prod` o configurar en el servidor:

```env
# Gateway
PORT=3004
BACKEND_BASE_URL=https://api.midominio.com

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/logistica_db

# Redis (para cache/sessions)
REDIS_URL=redis://prod-redis:6379

# Keycloak
KEYCLOAK_URL=https://auth.midominio.com
KEYCLOAK_REALM=logistica

# Timeouts (aumentados para producción)
CONFIG_SERVICE_TIMEOUT=10000
SHIPPING_SERVICE_TIMEOUT=10000
STOCK_INTEGRATION_SERVICE_TIMEOUT=10000

# Rate limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# Environment
NODE_ENV=production
```

---

## 📞 Comandos Útiles

### Limpiar & Reconstruir

```bash
# Limpiar todo
pnpm clean

# Reinstalar
pnpm install:all

# Compilar
pnpm build:shared
pnpm build

# Volver a empezar
pnpm dev
```

### Correr Tests

```bash
# Unit tests
pnpm test

# E2E tests del gateway
cd backend/services/operator-interface-service
pnpm test:e2e

# Coverage
pnpm test:cov

# Watch mode (rerun on change)
pnpm test:watch
```

### Linter & Formatter

```bash
# Chequear linting issues
pnpm lint

# (Automáticamente arregla lo que pueda)

# Formatear código
pnpm format
```

### Diagrama de Dependencias

```bash
# Ver estructura del monorepo
tree -L 3 -I node_modules backend/

# O más detallado
find backend/services -name "package.json" | xargs grep '"name"'
```

---

## 🎓 Referencias

- **Documentación del Proyecto**: [README.md](./README.md)
- **Documentación del Gateway**: [backend/services/operator-interface-service/GATEWAY.md](./backend/services/operator-interface-service/GATEWAY.md)
- **NestJS**: https://docs.nestjs.com
- **Prisma**: https://www.prisma.io/docs
- **pnpm**: https://pnpm.io
- **Docker Compose**: https://docs.docker.com/compose

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
**Autor**: Grupo 12 - UTN FRRE

---

## 💡 Tips Finales

1. **Siempre usa `pnpm`** - Evita conflictos de `npm`
2. **Antes de empezar día**: `pnpm install:all && pnpm dev`
3. **Si algo falla**: `pnpm clean && pnpm install:all && pnpm build:shared && pnpm dev`
4. **Monitorea con**: `curl http://localhost:3004/gateway/status | jq .`
5. **Busca logs con X-Request-ID** - Facilita debugging distribuido

¡Happy coding! 🚀
