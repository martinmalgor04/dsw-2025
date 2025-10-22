# 🚀 Despliegue (Docker + GitHub Actions)

## Imágenes Docker

### Backend (monolito actual)
- Dockerfile: `backend/Dockerfile`
- Multi-stage build, `npm install`, build Nest, generar Prisma Client, copiar `schema.prisma` y `.env` en runtime.

```bash
# Build local
docker build -t logistica-backend:dev -f backend/Dockerfile .

# Run local
docker run --rm -p 3000:3000 --env-file backend/.env logistica-backend:dev
```

> Healthcheck usa `wget --spider http://localhost:3000/health`.

### Frontend
- Dockerfile: `frontend/Dockerfile`
- `npm install`, copia `.svelte-kit`, expone puerto de dev con `--host 0.0.0.0`.

## Docker Compose

- Archivo recomendado: `docker-compose.yml` (stack local: postgres, redis, backend, frontend).
- Para microservicios ver `docker-compose.microservices.yml` (cuando se haga la transición).

## GitHub Actions

### Build & Push Imágenes
Workflow: `.github/workflows/docker-build-push.yml`
- Usa `context: ./${{ matrix.service }}` para backend/frontend.
- Cambiado `npm ci` → `npm install` por ausencia de `package-lock.json`.

Desencadenadores típicos:
- Push a `dev`, `RF-*`, `main`.
- Tags para releases.

## Variables de entorno

- Backend: `backend/env.example` (copiar a `.env`).
- Stock integration: `STOCK_API_URL`, timeouts, retries, Redis (opcional).
- Base de datos: `DATABASE_URL`, `DIRECT_URL` (Supabase).

## Troubleshooting CI/CD

- `npm ci` falla: usar `npm install` o commitear lock file.
- `openapi` invalid: verificar `openapilog.yaml` (`#/components` sin extras).
- Prisma `P1001` en build: inyectar `.env` válido o saltar conexión en build.

## Próximos pasos (microservicios)

- Un Dockerfile por servicio (config/shipping/stock/operator).
- Workflows separados por servicio.
- API Gateway opcional.
- Observabilidad (Prometheus/Grafana/Jaeger).
