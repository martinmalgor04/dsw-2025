# ===================================
# DOCKERFILE - OPERATOR INTERFACE SERVICE
# TPI Desarrollo de Software 2025
# ===================================

# Usar Node.js 20 Alpine para mejor rendimiento
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# ===================================
# STAGE 1: Build
# ===================================
FROM base AS build

# Copiar TODO el monorepo
COPY . .

# Instalar TODAS las dependencias desde raíz
RUN npm ci

# Instalar y construir shared/database
WORKDIR /app/shared/database
RUN npm ci && npm run build

# Instalar y construir shared/types
WORKDIR /app/shared/types
RUN npm ci && npm run build

# Instalar y construir shared/utils
WORKDIR /app/shared/utils
RUN npm ci && npm run build

# Instalar y construir operator-interface-service
WORKDIR /app/services/operator-interface-service
RUN npm ci && npm run build

# ===================================
# STAGE 2: Production
# ===================================
FROM base AS production

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3004

# Crear usuario no-root
USER nestjs

# Copiar estructura de directorios y node_modules
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/shared ./shared
COPY --from=build --chown=nestjs:nodejs /app/services/operator-interface-service/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/services/operator-interface-service/package*.json ./

# Exponer puerto
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3004/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/operator-interface-service/src/main.js"]
