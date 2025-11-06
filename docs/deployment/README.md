# 🚀 Guías de Despliegue - Arquitectura de Microservicios

## 📋 Información General

Este proyecto utiliza una **arquitectura de microservicios** con los siguientes componentes:

### Servicios Backend
- **Config Service** (puerto 3003): Gestión de configuraciones, métodos de transporte y zonas de cobertura
- **Shipping Service** (puerto 3001): Cálculo de costos de envío y operaciones de transporte
- **Stock Integration Service** (puerto 3002): Integración con sistemas de inventario
- **Operator Interface Service** (puerto 3004): API principal y gateway

### Servicios de Infraestructura
- **PostgreSQL** (puerto 5432): Base de datos principal
- **Redis** (puerto 6379): Cache y sesiones
- **Keycloak** (puerto 8080): Autenticación y autorización

### Frontend
- **Next.js App** (puerto 3000): Interfaz de usuario

## 🐳 Despliegue Local con Docker (Recomendado)

### Prerrequisitos
- Docker >= 20.x
- Docker Compose >= 2.x
- Git
- Al menos 4GB RAM disponible

### 1. Clonar y Configurar el Proyecto
```bash
# Clonar repositorio
git clone https://github.com/FRRe-DS/2025-12-TPI.git
cd 2025-12-TPI
```

### 2. Configurar Variables de Entorno para Supabase

**Importante**: Los microservicios usan **Supabase** como base de datos. Debes configurar las variables de entorno antes de levantar los servicios.

#### Crear archivo .env en la raíz del proyecto

```bash
# En la raíz del proyecto
cat > .env << 'EOF'
# URLs de Supabase (obtenerlas desde tu proyecto en Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
EOF
```

**Cómo obtener las URLs de Supabase:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **Database**
3. Copia la **Connection string** (URI) para `DATABASE_URL`
4. Para `DIRECT_URL`, usa la misma URL pero con puerto `5432` en lugar de `6543`

**Ejemplo de URLs:**
```bash
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:[TU_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.abcdefghijklmnop:[TU_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Nota**: 
- **Keycloak** usa su propia base de datos PostgreSQL local (se crea automáticamente)
- Los **microservicios** usan Supabase (configurar en `.env`)
- Los archivos `.env` individuales por servicio son opcionales

#### Ubicación de archivos .env:

```bash
# Config Service
backend/services/config-service/.env
# Copiar desde: backend/services/config-service/env.example

# Operator Interface Service  
backend/services/operator-interface-service/.env
# Copiar desde: backend/services/operator-interface-service/env.example

# Shipping Service (si existe)
backend/services/shipping-service/.env

# Stock Integration Service (si existe)
backend/services/stock-integration-service/.env

# Frontend (opcional, para desarrollo local)
frontend/.env.local
```

**Importante**: 
- En Docker Compose, las variables se configuran en `docker-compose.yml`
- Los `.env` son útiles para desarrollo local sin Docker
- No commitees archivos `.env` (deben estar en `.gitignore`)

### 3. Despliegue Completo con Docker Compose
```bash
# Levantar todos los servicios (construye imágenes si no existen)
docker-compose up -d --build

# Ver logs de todos los servicios
docker-compose logs -f

# Ver estado de los contenedores
docker-compose ps
```

### 4. Ejecutar Migraciones de Base de Datos
```bash
# Instalar dependencias del backend (necesario para Prisma)
cd backend
pnpm install

# Generar cliente Prisma
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate

# (Opcional) Cargar datos de ejemplo
# pnpm prisma:db:seed
```

### 5. Verificar Despliegue
```bash
# Verificar que todos los servicios estén saludables
curl http://localhost:3003/health  # Config Service
curl http://localhost:3001/health  # Shipping Service
curl http://localhost:3002/health  # Stock Service
curl http://localhost:3004/health  # Operator Interface
curl http://localhost:3000          # Frontend
```

### 6. Acceder a las Aplicaciones
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3004
- **Keycloak Admin**: http://localhost:8080 (admin/ds2025)
- **Swagger Docs**:
  - Config Service: http://localhost:3003/api/docs
  - Shipping Service: http://localhost:3001/api/docs
  - Stock Service: http://localhost:3002/api/docs
  - Operator Interface: http://localhost:3004/api/docs

### 7. Detener Servicios
```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (borra datos)
docker-compose down -v
```

## 🔧 Despliegue Manual (Desarrollo Local sin Docker)

### Prerrequisitos
- Node.js >= 18.x
- pnpm
- PostgreSQL >= 15
- Redis >= 7.x
- Git

### 1. Configurar Base de Datos
```bash
# Instalar PostgreSQL localmente o usar Docker
docker run -d --name postgres-local -p 5432:5432 \
  -e POSTGRES_DB=logistics_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  postgres:16-alpine

# Instalar Redis localmente o usar Docker
docker run -d --name redis-local -p 6379:6379 redis:7-alpine
```

### 2. Configurar Servicios Individuales

#### Config Service
```bash
cd backend/services/config-service
cp env.example .env
# Editar .env con credenciales de BD
pnpm install
pnpm run build
pnpm run start:prod
```

#### Shipping Service
```bash
cd backend/services/shipping-service
cp env.example .env
pnpm install
pnpm run build
pnpm run start:prod
```

#### Stock Integration Service
```bash
cd backend/services/stock-integration-service
cp env.example .env
pnpm install
pnpm run build
pnpm run start:prod
```

#### Operator Interface Service
```bash
cd backend/services/operator-interface-service
cp env.example .env
pnpm install
pnpm run build
pnpm run start:prod
```

### 3. Configurar Keycloak
```bash
# Usar Docker Compose solo para Keycloak
cd keycloak
docker-compose -f docker-compose.local.yml up -d
```

### 4. Configurar Frontend
```bash
cd frontend
pnpm install
pnpm run build
pnpm start
```

## 🐳 Build de Imágenes Docker Individuales

Cada servicio se construye desde la **raíz del monorepo**:

```bash
# Config Service
docker build \
  -f backend/services/config-service/Dockerfile \
  -t logistics-config-service:latest \
  --build-arg SERVICE_PATH=backend/services/config-service \
  --build-arg SERVICE_FILTER=@logistics/config-service \
  --build-arg PORT=3003 \
  .

# Shipping Service
docker build \
  -f backend/services/shipping-service/Dockerfile \
  -t logistics-shipping-service:latest \
  --build-arg SERVICE_PATH=backend/services/shipping-service \
  --build-arg SERVICE_FILTER=@logistics/shipping-service \
  --build-arg PORT=3001 \
  .

# Stock Integration Service
docker build \
  -f backend/services/stock-integration-service/Dockerfile \
  -t logistics-stock-service:latest \
  .

# Operator Interface Service
docker build \
  -f backend/services/operator-interface-service/Dockerfile \
  -t logistics-operator-service:latest \
  --build-arg SERVICE_PATH=backend/services/operator-interface-service \
  --build-arg SERVICE_FILTER=@logistics/operator-interface-service \
  --build-arg PORT=3004 \
  .

# Frontend
docker build \
  -f frontend/Dockerfile \
  -t logistics-frontend:latest \
  frontend/
```

## 🚀 Despliegue en Producción

### Estrategias de Despliegue

#### Opción 1: Docker Compose
```bash
# Para producción, usar docker-compose con variables de entorno de producción
docker-compose up -d --build
```

### Variables de Producción
```bash
# Base de datos (usar servicios gestionados)
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export DIRECT_URL="postgresql://user:pass@host:5432/db"

# Redis (usar Redis Cloud o AWS ElastiCache)
export REDIS_URL="redis://user:pass@host:6379"

# APIs externas
export DISTANCE_API_KEY="your-production-api-key"

# Seguridad
export JWT_SECRET="your-production-jwt-secret"
export KEYCLOAK_ADMIN_PASSWORD="strong-production-password"
```

## 🔄 CI/CD Pipeline

### GitHub Actions para Microservicios

#### Workflow de Testing Completo
```yaml
name: Test Microservices
on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [config-service, shipping-service, stock-integration-service, operator-interface-service]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Setup PostgreSQL
        uses: harmon758/postgresql-action@v1
        with:
          postgresql version: '16'
          postgresql db: 'logistics_test'
          postgresql user: 'postgres'
          postgresql password: 'postgres'
      - name: Setup Redis
        uses: supercharge/redis-github-action@1.8.0
      - name: Install dependencies
        run: |
          cd backend/services/${{ matrix.service }}
          pnpm install
      - name: Run tests
        run: |
          cd backend/services/${{ matrix.service }}
          pnpm run test:e2e

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      - name: Run tests
        run: |
          cd frontend
          pnpm run test
```

## 📊 Monitoreo y Observabilidad

### Health Checks por Servicio
```bash
# Verificar todos los servicios
curl http://localhost:3003/health  # Config Service
curl http://localhost:3001/health  # Shipping Service
curl http://localhost:3002/health  # Stock Service
curl http://localhost:3004/health  # Operator Interface
curl http://localhost:3000          # Frontend
curl http://localhost:8080/realms/ds-2025-realm/.well-known/openid-connect  # Keycloak

# Health checks detallados
curl http://localhost:3004/health/details  # Información completa del sistema
```

### Logs por Servicio
```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f config-service
docker-compose logs -f shipping-service
docker-compose logs -f operator-interface-service

# Logs con timestamps
docker-compose logs -f --timestamps
```

### Métricas y Monitoreo
```bash
# Métricas de cada servicio (si están habilitadas)
curl http://localhost:3003/metrics  # Config Service
curl http://localhost:3001/metrics  # Shipping Service
curl http://localhost:9090/metrics  # Métricas agregadas
```

#### Métricas Clave por Servicio
- **Config Service**: Consultas a BD, cache hits/misses, latencia de respuestas
- **Shipping Service**: Cálculos de costos, llamadas a APIs externas, timeouts
- **Stock Service**: Consultas de inventario, respuestas de APIs externas
- **Operator Interface**: Throughput, rate limiting, errores de autenticación

## 🔄 Estrategias de Rollback

### Rollback por Servicio
```bash
# Rollback de un servicio específico
docker-compose up -d --scale <service-name>=0
docker-compose up -d --scale <service-name>=1 --no-deps

# Rollback completo
docker-compose down
git checkout <previous-commit>
docker-compose up -d
```

### Versionado de Imágenes
```bash
# Etiquetado semántico
docker tag logistics-config-service:latest logistics-config-service:v1.2.3
docker push logistics-config-service:v1.2.3

# Rollback a versión específica
# Editar docker-compose.yml:
#   config-service:
#     image: logistics-config-service:v1.2.2  # Versión anterior
```

## 🔧 Troubleshooting - Problemas Comunes

### Servicios No Inician

#### PostgreSQL Connection Issues
```bash
# Verificar estado del contenedor
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres

# Verificar conectividad
docker-compose exec postgres pg_isready -U postgres -d logistics_db

# Reset de base de datos
docker-compose exec postgres psql -U postgres -d logistics_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

#### Redis Connection Issues
```bash
# Verificar conectividad
docker-compose exec redis redis-cli ping

# Verificar logs
docker-compose logs redis
```

#### Servicio No Puede Conectar a Dependencias
```bash
# Verificar variables de entorno
docker-compose exec <service-name> env | grep -E "(DATABASE|REDIS|CONFIG|SERVICE)"

# Verificar conectividad entre servicios
docker-compose exec config-service curl http://postgres:5432
docker-compose exec shipping-service curl http://config-service:3003/health
```

### Problemas de Base de Datos

#### Migraciones Fallidas
```bash
# Verificar estado de migraciones
cd backend
pnpm prisma migrate status

# Aplicar migraciones manualmente
pnpm prisma migrate deploy

# Reset completo (⚠️ Borra datos)
pnpm prisma migrate reset --force
```

#### Conexión a Prisma Issues
```bash
# Verificar schema de Prisma
cd backend
pnpm prisma db pull

# Generar cliente
pnpm prisma generate
```

### Problemas de Frontend

#### Build Issues - Error de Google Fonts
Si ves errores como "Failed to fetch Geist from Google Fonts" durante el build:
```bash
# El build necesita conexión a internet para descargar fuentes
# Soluciones:
# 1. Asegurar que Docker tenga acceso a internet
# 2. Construir con network host:
docker build --network=host -f frontend/Dockerfile -t logistics-frontend:latest frontend/

# 3. O cambiar a fuentes locales en frontend/src/app/layout.tsx
```

#### Build Issues - Dependencias
```bash
# Verificar dependencias
cd frontend
pnpm ls

# Rebuild forzado
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

#### API Connection Issues
```bash
# Verificar configuración de NEXT_PUBLIC_API_URL
docker-compose exec frontend env | grep NEXT_PUBLIC

# Verificar conectividad con API
docker-compose exec frontend curl http://operator-interface-service:3004/health

# Verificar CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     http://localhost:3004/health
```

### Comandos Útiles para Debug

```bash
# Ver estado completo del sistema
docker-compose ps -a

# Ver logs de errores recientes
docker-compose logs --tail=100 -f | grep -i error

# Ver uso de red
docker network ls
docker network inspect logistics_logistics-network

# Backup de base de datos
docker-compose exec postgres pg_dump -U postgres logistics_db > backup.sql

# Restore de base de datos
docker-compose exec -T postgres psql -U postgres logistics_db < backup.sql

# Limpiar contenedores huérfanos
docker system prune -f
docker volume prune -f
```

---

**Última actualización**: $(date +%d) de $(date +%B) de 2025