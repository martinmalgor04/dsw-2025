# ===================================
# DOCKERFILE - OPERATOR INTERFACE SERVICE
# TPI Desarrollo de Software 2025
# Asume build context = raíz del monorepo
# ===================================

# Usar Node.js 20 Alpine para mejor rendimiento
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    dumb-init \
    openssl \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 \
    && npm install -g pnpm@latest

# Establecer directorio de trabajo
WORKDIR /app

# ===================================
# STAGE 1: Builder
# ===================================
FROM base AS builder

# Copiar monorepo completo
COPY . .

# Instalar todas las dependencias del monorepo
RUN pnpm install

# Construir solo el operator service
RUN pnpm -C backend/services/operator-interface-service run build

# ===================================
# STAGE 2: Production
# ===================================
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3004

# Copiar package.json del operator
COPY backend/services/operator-interface-service/package.json /app/package.json

# Copiar node_modules COMPLETO incluyendo .pnpm
# pnpm estructura los módulos con symlinks en .pnpm, todos deben copiarse juntos
COPY --from=builder /app/node_modules /app/node_modules

# Copiar dist del operator
COPY --from=builder /app/backend/services/operator-interface-service/dist /app/dist

# Permisos
RUN chown -R nestjs:nodejs /app

# Crear usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
