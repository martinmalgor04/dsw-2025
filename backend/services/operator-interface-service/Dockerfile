# ===================================
# DOCKERFILE - OPERATOR INTERFACE SERVICE
# TPI Desarrollo de Software 2025
# Diseñado para correr desde Dokploy con context /backend/services/operator-interface-service
# ===================================

# Usar Node.js 20 Alpine para mejor rendimiento
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias (incluyendo OpenSSL para Prisma)
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
# STAGE 1: Dependencies
# ===================================
FROM base AS deps

# Copiar solo package.json del operator
COPY package.json ./

# Instalar dependencias de producción
RUN pnpm install --prod

# ===================================
# STAGE 2: Builder
# ===================================
FROM base AS builder

# Copiar package.json del operator
COPY package.json ./

# Instalar todas las dependencias (incluyendo dev)
RUN pnpm install

# Copiar código fuente del operator
COPY . .

# Construir la aplicación NestJS
RUN pnpm run build

# ===================================
# STAGE 3: Runner (Producción)
# ===================================
FROM base AS production

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3004

# Crear usuario no-root
USER nestjs

# Copiar dependencias de producción desde stage deps
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar aplicación construida desde stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Exponer puerto
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
