# ===================================
# DOCKERFILE - FRONTEND NEXT.JS
# TPI Desarrollo de Software 2025
# ===================================

# Force rebuild timestamp: 2025-10-27T12:30:00Z
# (cambiar este valor fuerza Docker a ignorar caché)

# Usar Node.js 20 Alpine para mejor rendimiento
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# ===================================
# STAGE 1: Dependencies
# ===================================
FROM base AS deps

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# ===================================
# STAGE 2: Builder
# ===================================
FROM base AS builder

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación Next.js
RUN npm run build

# ===================================
# STAGE 3: Runner
# ===================================
FROM base AS runner

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root
USER nextjs

# Copiar dependencias de producción
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar aplicación construida
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Exponer puerto
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3005', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]