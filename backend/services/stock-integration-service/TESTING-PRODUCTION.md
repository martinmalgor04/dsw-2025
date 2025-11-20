# 🧪 Ejecutar Tests de Jest en Producción

Este documento explica las diferentes formas de ejecutar tests de Jest en producción para el Stock Integration Service.

## 📋 Opciones Disponibles

### 1. **Tests Durante el Build (Recomendado)** ✅

Ejecutar tests durante el proceso de build de Docker, antes de crear la imagen de producción.

#### Ventajas:
- Detecta problemas antes del deploy
- No aumenta el tamaño de la imagen final
- Falla el build si los tests fallan

#### Implementación:

Agregar un stage de testing en el Dockerfile después del build:

```dockerfile
# ===================================
# Stage 3.5: Test
# Ejecutar tests después del build
# ===================================
FROM build AS test

ARG SERVICE_PATH

WORKDIR /app/${SERVICE_PATH}

# Ejecutar tests unitarios
RUN pnpm test -- --passWithNoTests

# Ejecutar tests E2E (opcional, requiere servicios corriendo)
# RUN pnpm test:e2e
```

Luego modificar el stage `build` para que continúe solo si los tests pasan:

```dockerfile
# En el stage build, después de compilar:
RUN pnpm run build

# Agregar tests aquí o en un stage separado
RUN pnpm test -- --passWithNoTests || (echo "Tests failed!" && exit 1)
```

#### Uso:

```bash
# Build con tests (falla si tests fallan)
docker build \
  -f backend/services/stock-integration-service/Dockerfile \
  -t stock-service:test \
  --target test \
  .

# Build completo (incluye tests)
docker build \
  -f backend/services/stock-integration-service/Dockerfile \
  -t stock-service:latest \
  .
```

---

### 2. **Tests en CI/CD Antes del Deploy** ✅

Ejecutar tests en GitHub Actions o CI/CD antes de hacer el deploy.

#### Ventajas:
- No afecta el tiempo de build de producción
- Puede ejecutarse en paralelo
- Permite diferentes configuraciones de test

#### Ejemplo GitHub Actions:

```yaml
name: Build and Test Stock Service

on:
  push:
    branches: [main, dev]
    paths:
      - 'backend/services/stock-integration-service/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          pnpm install --frozen-lockfile
      
      - name: Build
        run: |
          cd backend/services/stock-integration-service
          pnpm run build
      
      - name: Run unit tests
        run: |
          cd backend/services/stock-integration-service
          pnpm test
      
      - name: Run E2E tests
        run: |
          cd backend/services/stock-integration-service
          pnpm test:e2e
      
      - name: Build Docker image
        if: success()
        run: |
          docker build \
            -f backend/services/stock-integration-service/Dockerfile \
            -t stock-service:latest \
            .
```

---

### 3. **Tests en Contenedor de Producción (No Recomendado)** ⚠️

Incluir Jest y dependencias de desarrollo en la imagen de producción.

#### Desventajas:
- Aumenta significativamente el tamaño de la imagen
- Expone código fuente y herramientas de desarrollo
- No es una práctica recomendada

#### Si realmente necesitas hacerlo:

Modificar el Dockerfile para incluir devDependencies:

```dockerfile
# En el stage runtime, copiar también node_modules completos
COPY --from=build --chown=nestjs:nodejs /app/${SERVICE_PATH}/node_modules ./${SERVICE_PATH}/node_modules

# Ejecutar tests después del deploy
CMD ["sh", "-c", "pnpm test && node dist/main.js"]
```

#### Ejecutar tests manualmente en contenedor:

```bash
# Entrar al contenedor
docker exec -it <container-name> sh

# Dentro del contenedor
cd /app/backend/services/stock-integration-service
pnpm test
```

---

### 4. **Smoke Tests Post-Deploy (Recomendado)** ✅

Ejecutar tests básicos después del deploy para validar que el servicio funciona.

#### Implementación:

Crear un script de smoke tests que valide funcionalidad básica:

```bash
#!/bin/bash
# smoke-tests.sh

SERVICE_URL=${1:-http://localhost:3002}

echo "🧪 Running smoke tests against $SERVICE_URL"

# Test 1: Health check
echo "Testing health endpoint..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health")
if [ "$HEALTH" != "200" ]; then
  echo "❌ Health check failed: $HEALTH"
  exit 1
fi
echo "✅ Health check passed"

# Test 2: Service info
echo "Testing service info..."
INFO=$(curl -s "$SERVICE_URL/")
if [ -z "$INFO" ]; then
  echo "❌ Service info failed"
  exit 1
fi
echo "✅ Service info passed"

echo "🎉 All smoke tests passed!"
```

#### Uso:

```bash
# En Dokploy o CI/CD después del deploy
./smoke-tests.sh https://stock-service.production.com
```

---

### 5. **Tests E2E Contra Producción** ✅

Ejecutar tests E2E desde tu máquina local o CI/CD contra el servicio en producción.

#### Configuración:

Crear archivo `.env.production`:

```bash
STOCK_API_URL=https://stock-service.production.com
NODE_ENV=production
```

#### Ejecutar:

```bash
# Desde tu máquina local
cd backend/services/stock-integration-service
NODE_ENV=production pnpm test:e2e

# O con variables de entorno específicas
STOCK_API_URL=https://stock-service.production.com pnpm test:e2e
```

---

## 🎯 Recomendación Final

**Para producción, usa esta estrategia combinada:**

1. ✅ **Tests en CI/CD** antes del deploy (GitHub Actions)
2. ✅ **Tests durante build** de Docker (stage de testing)
3. ✅ **Smoke tests post-deploy** para validar funcionalidad básica
4. ✅ **Health checks** continuos (ya implementado en Dockerfile)

**NO incluyas Jest en la imagen de producción** a menos que sea absolutamente necesario.

---

## 📝 Scripts Útiles

### Ejecutar tests localmente (simulando producción):

```bash
# Unit tests
cd backend/services/stock-integration-service
NODE_ENV=production pnpm test

# E2E tests (requiere servicios corriendo)
pnpm test:e2e

# Con coverage
pnpm test:cov
```

### Ejecutar tests en contenedor Docker:

```bash
# Build con stage de test
docker build \
  --target test \
  -f backend/services/stock-integration-service/Dockerfile \
  .

# O ejecutar tests en contenedor ya corriendo
docker exec -it <container> sh -c "cd /app/backend/services/stock-integration-service && pnpm test"
```

---

## 🔗 Referencias

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

