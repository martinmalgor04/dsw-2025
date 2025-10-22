# Operación Manual del Backend (Microservicios)

Esta guía explica cómo levantar, compilar, testear y apagar los microservicios manualmente (sin el script de automatización).

Servicios y puertos por defecto:
- shipping-service: 3001
- stock-integration-service: 3002
- config-service: 3003

Requisitos:
- Node.js 20+
- npm 10+
- Docker (opcional para compose)

---

## 1) Variables de entorno
Crea los archivos `.env`:

- `backend/services/shipping-service/.env`
- `backend/services/stock-integration-service/.env`
- `backend/services/config-service/.env`

Ejemplo para shipping-service (.env):
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/logistics"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/logistics"
PRODUCT_CACHE_TTL=600
DISTANCE_CACHE_TTL=3600
# DISTANCE_API_URL=https://api.distancematrix.ai/maps/api/distancematrix/json
# DISTANCE_API_KEY=your-distance-api-key
STOCK_SERVICE_URL=http://localhost:3002
CONFIG_SERVICE_URL=http://localhost:3003
```

---

## 2) Construir librerías compartidas
Desde la raíz del repo:
```bash
cd backend/shared/database && npm install && npm run build
cd ../types && npm install && npm run build
cd ../utils && npm install && npm run build
```

---

## 3) Instalar y compilar cada microservicio
```bash
# Config Service
cd ../../../services/config-service && npm install && npm run build

# Stock Integration Service
cd ../stock-integration-service && npm install && npm run build

# Shipping Service
cd ../shipping-service && npm install && npm run build
```

---

## 4) Ejecutar tests (opcional)
```bash
# En cada servicio
npm test
```

---

## 5) Levantar en modo desarrollo (uno por terminal)
En tres terminales separadas:

Terminal A (config-service):
```bash
cd backend/services/config-service
npm run start:dev
```

Terminal B (stock-integration-service):
```bash
cd backend/services/stock-integration-service
npm run start:dev
```

Terminal C (shipping-service):
```bash
cd backend/services/shipping-service
npm run start:dev
```

Verificación rápida:
```bash
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3002/health | jq .
curl -s http://localhost:3003/health | jq .
```

---

## 6) Levantar con Docker Compose (opcional)
```bash
cd backend
docker compose -f docker-compose.microservices.yml up -d --build
# apagar
docker compose -f docker-compose.microservices.yml down
```

---

## 7) Endpoints útiles
- Shipping Service docs: `http://localhost:3001/api/docs`
- Stock Integration docs: `http://localhost:3002/api/docs`
- Config Service docs: `http://localhost:3003/api/docs`

---

## 8) Problemas comunes
- Puerto en uso: matar proceso
```bash
lsof -i :3001
kill -9 <PID>
```
- Prisma y Supabase: usa `DATABASE_URL` (pooling) y `DIRECT_URL` (migraciones) correctas.
- Faltan dependencias: correr `npm install` en shared y servicios y volver a compilar.

---

## 9) Apagado
- Dev: cerrar terminales o `pkill -f "nest start --watch"`.
- Docker: `docker compose -f backend/docker-compose.microservices.yml down`.

---

Para automatizar estos pasos existe el script `backend/scripts/operate-backend.sh` con comandos: `install`, `build`, `test`, `start`, `stop`, `up`, `down`.
