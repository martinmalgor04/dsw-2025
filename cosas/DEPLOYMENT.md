# Guía de Despliegue - LogiX Monorepo

Esta guía resume cómo levantar el ecosistema completo en local y cómo preparar despliegue CI/CD.

## 📦 Componentes
- Backend (microservicios NestJS)
- Frontend (React + Vite)
- Base de Datos (Supabase PostgreSQL)
- Prisma (migraciones y seed)
- Redis (opcional para cache)
- Keycloak (autenticación)
- Docker / GitHub Actions

---

## ✅ Prerrequisitos
- Node.js 18+
- npm 10+
- Docker + Docker Compose
- Acceso a Supabase (DATABASE_URL y DIRECT_URL)

---

## 🔐 Variables de Entorno

### Backend (ejemplo)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
REDIS_URL=redis://localhost:6379
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=logistica
KEYCLOAK_CLIENT_ID=logix-backend
KEYCLOAK_CLIENT_SECRET=xxxx
```

### Frontend (Vite)
```
VITE_API_URL=http://localhost:3004
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=logistica
VITE_KEYCLOAK_CLIENT_ID=logix-frontend
```

---

## 🗄️ Base de Datos (Supabase + Prisma)

Ubicación: `backend/shared/database`

1) Validar schema
```
cd backend/shared/database
./scripts/validate-schema.sh
```

2) Desplegar migraciones
```
./scripts/migrate-deploy.sh
```

3) (Opcional) Seed
```
./scripts/migrate-deploy.sh  # el script ofrece ejecutar seed
```

---

## 🔐 Keycloak en Local (Docker)

Archivo de referencia en `specs/006-http-services/keycloak-integration.md` (compose incluido).

Pasos rápidos:
```
docker compose -f docker-compose.keycloak.yml up -d
# Acceder a http://localhost:8080
# Crear realm "logistica" y client "logix-frontend" (PKCE)
```

---

## 🖥️ Backend - Ejecutar Microservicios

Dependiendo de cómo quedó organizado, en cada servicio:
```
cd backend/services/<service>
npm install
npm run build
npm start
```

Health endpoints esperados:
- shipping-service: :3001/health
- stock-integration-service: :3002/health
- config-service: :3003/health
- operator-interface-service: :3004/health

Scripts útiles: `backend/scripts/run-all-tests.sh`, `test-api-*.sh`.

---

## 🌐 Frontend - Desarrollo y Build
```
cd frontend
npm install
npm run dev   # http://localhost:3000
npm run build # genera /build
```

Configurar `.env.local` con Vite vars (ver arriba).

---

## 🧪 CI/CD (GitHub Actions)

Workflows:
- `.github/workflows/test-microservices.yml` (build+tests)
- `.github/workflows/docker-build-push.yml` (imágenes)
- `.github/workflows/validate-openapi.yml`
- `.github/workflows/validate-services-startup.yml`

Requisitos:
- Secrets con credenciales de registro Docker (si aplica)
- Variables de entorno para Back/Front (si se despliega con CI)

---

## 🧰 Troubleshooting

- Prisma P1012 / P1001: verificar `DATABASE_URL`/`DIRECT_URL` en `.env` de `backend/shared/database`.
- Docker build falla por `package.json` faltante: verificar contexto `./backend/services/<service>`.
- OpenAPI validation: revisar `openapilog.yaml` (no permitir properties extra en `components`).
- Keycloak 401: confirmar realm/cliente/redirect URIs y PKCE.
- Frontend carga mock en lugar de API: verificar `VITE_API_URL` y que Operator Interface esté en :3004.

---

## 🚀 Producción (alto nivel)

- Base de datos: aplicar migraciones con Prisma (usar DIRECT_URL)
- Backend: construir imágenes Docker por servicio y desplegar
- Frontend: `npm run build` y servir `/build` (Nginx u otro)
- Keycloak: cluster/gestión externa o contenedor dedicado
- Observabilidad: logs y health endpoints en CI
