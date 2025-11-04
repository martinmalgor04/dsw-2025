# ===================================
# DOCKERFILE - CONFIG SERVICE
# TPI Desarrollo de Software 2025
# Multi-stage build optimizado con pnpm
# ===================================

# ===================================
# Stage 1: Base - Preparación
# ===================================
FROM node:20-alpine AS base

RUN apk add --no-cache \
    dumb-init \
    openssl \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 \
    && npm install -g pnpm@latest

WORKDIR /app

# ===================================
# Stage 2: Dependencies - Instalación
# ===================================
FROM base AS dependencies

# Copiar manifiestos del monorepo (SOLO manifiestos para caché eficiente)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY backend/shared/database/package.json ./backend/shared/database/
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/services/config-service/package.json ./backend/services/config-service/

# Instalar dependencias usando pnpm (respeta workspace)
RUN pnpm install --frozen-lockfile

# ===================================
# Stage 3: Builder - Compilación
# ===================================
FROM dependencies AS builder

# Copiar código fuente
COPY backend/shared ./backend/shared
COPY backend/services/config-service ./backend/services/config-service
COPY tsconfig.json ./

# Compilar librerías compartidas
RUN pnpm --filter @logistics/database build
RUN pnpm --filter @logistics/types build
RUN pnpm --filter @logistics/utils build

# Compilar config-service
RUN pnpm --filter @logistics/config-service build

# ===================================
# Stage 4: Production - Runtime
# ===================================
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3003

# Copiar node_modules completo (pnpm ya maneja workspace links correctamente)
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar aplicación compilada
COPY --from=builder --chown=nestjs:nodejs /app/backend/services/config-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/backend/services/config-service/package.json ./

# Copiar Prisma client (necesario en runtime)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nestjs:nodejs /app/backend/shared/database/prisma ./prisma

# Cambiar a usuario no-root
USER nestjs

EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
