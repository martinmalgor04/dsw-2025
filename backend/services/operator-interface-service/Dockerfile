# ===================================
# DOCKERFILE - OPERATOR INTERFACE SERVICE
# TPI Desarrollo de Software 2025
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
# STAGE 1: Build
# ===================================
FROM base AS build

# Copiar TODO el monorepo
COPY . .

# Instalar TODAS las dependencias desde raíz
RUN pnpm install

# Instalar y construir shared/database
WORKDIR /app/shared/database
RUN pnpm run build

# Instalar y construir shared/types
WORKDIR /app/shared/types
RUN pnpm run build

# Instalar y construir shared/utils
WORKDIR /app/shared/utils
RUN pnpm run build

# Instalar y construir operator-interface-service
WORKDIR /app/services/operator-interface-service
RUN pnpm run build

# ===================================
# STAGE 2: Production
# ===================================
FROM base AS production

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3004

# Establecer directorio de trabajo
WORKDIR /app

# Copiar aplicación construida
COPY --from=build --chown=nestjs:nodejs /app/services/operator-interface-service/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/services/operator-interface-service/package*.json ./

# Copiar node_modules del servicio (dependencias directas del servicio)
COPY --from=build --chown=nestjs:nodejs /app/services/operator-interface-service/node_modules ./node_modules

# Copiar Prisma schema y archivos generados
COPY --from=build --chown=nestjs:nodejs /app/shared/database/prisma ./prisma

# Copiar Prisma dependencies de shared/database
COPY --from=build --chown=nestjs:nodejs /app/shared/database/node_modules/@prisma ./node_modules/@prisma
COPY --from=build --chown=nestjs:nodejs /app/shared/database/node_modules/.prisma ./node_modules/.prisma

# Copiar archivos compilados de shared packages
COPY --from=build --chown=nestjs:nodejs /app/shared/database/dist ./shared/database/dist
COPY --from=build --chown=nestjs:nodejs /app/shared/types/dist ./shared/types/dist
COPY --from=build --chown=nestjs:nodejs /app/shared/utils/dist ./shared/utils/dist

# Crear directorios para módulos locales y hacer symlinks (para resolver @logistics/*)
# Los archivos compilados están en ./shared/*/dist, apuntamos a los índices compilados
RUN mkdir -p /app/node_modules/@logistics && \
    rm -rf /app/node_modules/@logistics/database && \
    rm -rf /app/node_modules/@logistics/types && \
    rm -rf /app/node_modules/@logistics/utils && \
    ln -s /app/shared/database/dist /app/node_modules/@logistics/database && \
    ln -s /app/shared/types/dist /app/node_modules/@logistics/types && \
    ln -s /app/shared/utils/dist /app/node_modules/@logistics/utils && \
    chown -h nestjs:nodejs /app/node_modules/@logistics/*

# Crear usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3004/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
