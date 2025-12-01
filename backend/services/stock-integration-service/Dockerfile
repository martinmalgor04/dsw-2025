# ===================================
# DOCKERFILE - STOCK INTEGRATION SERVICE
# TPI Desarrollo de Software 2025
# Optimizado para monorepo pnpm con multi-stage build
# Build Context: . (raíz del monorepo)
# ===================================

ARG NODE_VERSION=20
ARG SERVICE_PATH=backend/services/stock-integration-service
ARG SERVICE_FILTER=@logistics/stock-integration-service
ARG PORT=3002

# ===================================
# Stage 1: Base - Node Alpine + pnpm
# ===================================
FROM node:${NODE_VERSION}-alpine AS base

# Instalar dependencias del sistema necesarias (OpenSSL para Prisma)
RUN apk add --no-cache \
    dumb-init \
    openssl \
    curl \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

WORKDIR /app

# ===================================
# Stage 2: Dependencies Fetch
# Pre-fetch dependencies usando lockfile
# ===================================
FROM base AS deps

# Copiar solo archivos necesarios para pnpm fetch
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Pre-fetch de dependencias (caché optimizado)
RUN pnpm fetch

# ===================================
# Stage 3: Build
# Instalar deps + compilar TypeScript
# ===================================
FROM base AS build

ARG SERVICE_PATH
ARG SERVICE_FILTER

# Copiar archivos de configuración del monorepo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copiar tsconfig padre necesario para extender
COPY backend/tsconfig.json ./backend/

# Copiar package.json de todos los paquetes necesarios
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/shared/database/package.json ./backend/shared/database/
COPY ${SERVICE_PATH}/package.json ./${SERVICE_PATH}/

# Copiar código fuente de shared packages (dependencias workspace)
COPY backend/shared/types ./backend/shared/types
COPY backend/shared/utils ./backend/shared/utils
COPY backend/shared/database ./backend/shared/database

# Copiar código fuente del servicio
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

# Instalar dependencias usando --filter (incluye workspace dependencies)
RUN pnpm install --frozen-lockfile --filter=${SERVICE_FILTER}...

# Compilar shared packages PRIMERO (el servicio depende de estos)
RUN pnpm --filter @logistics/types run build
RUN pnpm --filter @logistics/utils run build
RUN pnpm --filter @logistics/database run build

# Build del servicio (y sus dependencias workspace)
WORKDIR /app/${SERVICE_PATH}
RUN pnpm run build

# ===================================
# Stage 4: Production Dependencies
# Solo instalar production dependencies
# ===================================
FROM base AS prod-deps

ARG SERVICE_PATH
ARG SERVICE_FILTER

# Copiar archivos de configuración
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copiar package.json necesarios
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/shared/database/package.json ./backend/shared/database/
COPY ${SERVICE_PATH}/package.json ./${SERVICE_PATH}/

# Copiar prisma schema para generar cliente
COPY backend/shared/database/prisma ./backend/shared/database/prisma

# Instalar SOLO production dependencies
RUN pnpm install --frozen-lockfile --filter=${SERVICE_FILTER}... --prod --ignore-scripts

# ===================================
# Stage 5: Runtime - Imagen Final
# ===================================
FROM base AS runtime

ARG SERVICE_PATH
ARG PORT

ENV NODE_ENV=production
ENV PORT=${PORT}

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copiar estructura completa de node_modules de pnpm (incluye .pnpm store)
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar .pnpm store desde build stage (contiene Prisma Client generado)
COPY --from=build --chown=nestjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

# Copiar workspace dependencies COMPILADOS desde build stage
COPY --from=build --chown=nestjs:nodejs /app/backend/shared/types ./backend/shared/types
COPY --from=build --chown=nestjs:nodejs /app/backend/shared/utils ./backend/shared/utils
COPY --from=build --chown=nestjs:nodejs /app/backend/shared/database ./backend/shared/database

# Copiar node_modules del servicio específico
COPY --from=prod-deps --chown=nestjs:nodejs /app/${SERVICE_PATH}/node_modules ./${SERVICE_PATH}/node_modules

# Copiar artefactos compilados desde stage build
COPY --from=build --chown=nestjs:nodejs /app/${SERVICE_PATH}/dist ./${SERVICE_PATH}/dist

# Copiar package.json para referencia
COPY --from=build --chown=nestjs:nodejs /app/${SERVICE_PATH}/package.json ./${SERVICE_PATH}/package.json

# Cambiar al directorio del servicio para que Node resuelva módulos correctamente
WORKDIR /app/${SERVICE_PATH}

USER nestjs

EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Comando de inicio con dumb-init (manejo correcto de señales)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
