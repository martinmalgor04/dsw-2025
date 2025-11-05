# Optimización de Dockerfiles para Monorepo con pnpm - Enfoque Iterativo

## Objetivos
- Construir cada microservicio de forma independiente
- Reusar caché agresivamente con `pnpm fetch` y `--filter`
- Incluir shared libs sin instalar todo el monorepo
- Soportar Prisma (engines MUSL) correctamente
- Producir imágenes slim y determinísticas
- **Trabajar UN microservicio a la vez, probarlo, luego usar como base para el siguiente**

## Estado Actual Identificado
- **Decisión confirmada**: Mantener scope `@logistics/*`
- Paquetes ya tienen nombres únicos: `@logistics/*`
- Prisma ya tiene `binaryTargets` pero solo con `linux-musl-arm64-openssl-3.0.x` (falta genérico `linux-musl`)
- Frontend ya tiene `output: 'standalone'` configurado
- Dockerfiles actuales no optimizados para monorepo con pnpm
- `.dockerignore` existe pero necesita mejoras
- **NO se creará Makefile**

## Orden de Implementación (Confirmado)

### 1. operator-interface-service (puerto 3004) - PRIMERO
- Orquestador/API Gateway
- Variables de entorno: `KEYCLOAK_URL`, `KEYCLOAK_REALM`
- NO usa Prisma directamente
- Dockerfile: `backend/services/operator-interface-service/Dockerfile`

### 2. config-service (puerto 3003) - SEGUNDO
- Variables de entorno: `DATABASE_URL`, `DIRECT_URL`
- Usa Prisma (shared/database)
- Dockerfile: `backend/services/config-service/Dockerfile`
- **Reusar patrón probado de operator-interface-service**

### 3. shipping-service (puerto 3001) - TERCERO
- Variables de entorno: `PORT=3001`, `NODE_ENV`, `DATABASE_URL`, `DIRECT_URL`, `LOG_LEVEL`
- Usa Prisma (shared/database)
- **Script de build especial**: `nest build && sh -c 'cd dist && cp -rn services/shipping-service/src/* . ; rm -rf services/*/src shared'`
- Dockerfile: `backend/services/shipping-service/Dockerfile`
- **Reusar patrón probado de config-service**

### 4. stock-integration-service (puerto 3002) - CUARTO
- No está desarrollado aún
- Usa Prisma (shared/database)
- Dockerfile: `backend/services/stock-integration-service/Dockerfile`
- Dockerfile simple basado en patrón anterior

## Cambios Requeridos

### 1. Actualizar .dockerignore
**Archivo**: `.dockerignore` (raíz)

Añadir exclusiones optimizadas:
```
.pnpm-store
**/.turbo
```

Mantener exclusiones críticas (docs, tests, etc.) pero asegurar que `pnpm-lock.yaml`, `pnpm-workspace.yaml` y `package.json` necesarios NO estén excluidos.

### 2. Actualizar Prisma schema
**Archivo**: `backend/shared/database/prisma/schema.prisma`

Actualizar generator para incluir target genérico:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "linux-musl-arm64-openssl-3.0.x"]
}
```

### 3. Patrón Dockerfile para Microservicios

**Estructura multi-stage**:
1. **base**: Node 20 Alpine + pnpm + dependencias del sistema
2. **deps**: Pre-fetch con `pnpm fetch` (solo package.json relevantes)
3. **build**: Instalar con `--filter`, generar Prisma si aplica, compilar
4. **prune**: Eliminar devDependencies
5. **runtime**: Imagen slim final con solo artefactos necesarios

**Variables ARG por servicio**:
- `SERVICE_PATH`: Ruta del servicio (ej: `backend/services/config-service`)
- `SERVICE_FILTER`: Filtro pnpm (ej: `@logistics/config-service`)
- `PORT`: Puerto del servicio (3003, 3004, 3001, 3002 respectivamente)

**Comandos de build**:
```bash
docker build -f backend/services/<servicio>/Dockerfile \
  --build-arg SERVICE_PATH=backend/services/<servicio> \
  --build-arg SERVICE_FILTER=@logistics/<servicio> \
  -t logistics/<servicio>:latest .
```

## Proceso de Trabajo Iterativo

Para cada microservicio:

1. **Crear/actualizar Dockerfile** con patrón optimizado
2. **Construir imagen localmente**:
   ```bash
   docker build -f backend/services/<servicio>/Dockerfile \
     --build-arg SERVICE_PATH=backend/services/<servicio> \
     --build-arg SERVICE_FILTER=@logistics/<servicio> \
     -t logistics/<servicio>:latest .
   ```
3. **Verificar que la imagen se construye correctamente**
4. **(Opcional) Ejecutar contenedor** para verificar que inicia:
   ```bash
   docker run --rm -p <PUERTO>:<PUERTO> \
     --env-file backend/services/<servicio>/.env \
     logistics/<servicio>:latest
   ```
5. **Si funciona**: Usar como base para el siguiente microservicio
6. **Si falla**: Ajustar y probar nuevamente

## Checklist de Validación

Para cada servicio, verificar:
- ✅ Imagen se construye correctamente
- ✅ Tamaño de imagen optimizado
- ✅ Caché se reutiliza entre builds
- ✅ Prisma funciona (si aplica)
- ✅ Servicio inicia correctamente con variables de entorno desde `.env` del servicio

## Variables de Entorno por Servicio

### operator-interface-service
- `KEYCLOAK_URL`
- `KEYCLOAK_REALM`

### config-service
- `DATABASE_URL`
- `DIRECT_URL`

### shipping-service
- `PORT=3001`
- `NODE_ENV`
- `DATABASE_URL`
- `DIRECT_URL`
- `LOG_LEVEL`

### stock-integration-service
- (Por definir - no desarrollado aún)

## Notas Importantes

- **NO se creará Makefile** - usar comandos docker directamente
- **Trabajar uno por vez** - probar cada microservicio antes de continuar
- **Reusar patrón probado** - cada microservicio usa el anterior como base
- **Scope mantenido**: `@logistics/*` (no cambiar)
- **Prisma**: Solo servicios que usan `@logistics/database` necesitan `prisma generate`
- **shipping-service**: Tiene script de build especial que debe mantenerse

## Tareas Pendientes

- [ ] Actualizar `.dockerignore` con exclusiones optimizadas
- [ ] Actualizar Prisma schema (binaryTargets)
- [ ] Crear Dockerfile para operator-interface-service
- [ ] Probar build de operator-interface-service
- [ ] Crear Dockerfile para config-service (basado en operator)
- [ ] Probar build de config-service
- [ ] Crear Dockerfile para shipping-service (basado en config)
- [ ] Probar build de shipping-service
- [ ] Crear Dockerfile para stock-integration-service (basado en shipping)
- [ ] Probar build de stock-integration-service
- [ ] (Opcional) Actualizar Dockerfile de frontend
- [ ] Verificar scripts en package.json (prisma:generate si falta)

