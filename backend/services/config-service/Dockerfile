# ===================================
# DOCKERFILE - CONFIG SERVICE
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
# STAGE 1: Dependencies
# ===================================
FROM base AS dependencies

# Copiar archivos de dependencias
COPY package*.json ./
COPY shared/ ./shared/

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# ===================================
# STAGE 2: Build
# ===================================
FROM base AS build

# Copiar archivos de dependencias
COPY package*.json ./
COPY shared/ ./shared/

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# Copiar código fuente
COPY . .

# Construir librerías compartidas primero
WORKDIR /app/shared/database
RUN npm install && npm run build

WORKDIR /app/shared/types
RUN npm install && npm run build

WORKDIR /app/shared/utils
RUN npm install && npm run build

# Volver al directorio del servicio
WORKDIR /app

# Construir solo el config-service
RUN npm run build --prefix=services/config-service

# ===================================
# STAGE 3: Production
# ===================================
FROM base AS production

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3003

# Crear usuario no-root
USER nestjs

# Copiar dependencias de producción
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar aplicación construida
COPY --from=build --chown=nestjs:nodejs /app/services/config-service/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Exponer puerto
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
