# ===================================
# DOCKERFILE - CONFIG SERVICE
# TPI Desarrollo de Software 2025
# Multi-stage build optimizado con pnpm
# Build Context: . (monorepo root)
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
# Stage 2: Runtime Dependencies
# ===================================
FROM base AS runtime-deps

# Copiar configuración del monorepo
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copiar estructura completa para resolver workspace
COPY backend/services ./backend/services
COPY backend/shared ./backend/shared

# Instalar solo dependencias de runtime (no devDependencies, no scripts)
RUN pnpm install --prod --ignore-scripts

# ===================================
# Stage 3: Production
# ===================================
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3003

# Copiar pre-built dist (compilado en desarrollo local)
COPY backend/services/config-service/dist ./dist

# Copiar node_modules de runtime
COPY --from=runtime-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar package.json para referencia
COPY backend/services/config-service/package.json ./

# Cambiar a usuario no-root
USER nestjs

EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
