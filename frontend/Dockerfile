# ===================================
# DOCKERFILE - FRONTEND NEXT.JS
# TPI Desarrollo de Software 2025
# Construida dentro de carpeta /frontend
# ===================================

# Usar Node.js 20 Alpine para mejor rendimiento
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    dumb-init \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 \
    && npm install -g pnpm@latest

# Establecer directorio de trabajo
WORKDIR /app

# ===================================
# STAGE 1: Dependencies (Producción)
# ===================================
FROM base AS deps

# Copiar solo package.json del frontend
COPY package.json ./

# Instalar dependencias de producción
# Nota: Sin pnpm-lock.yaml, instala con versiones flexibles
RUN pnpm install --prod

# ===================================
# STAGE 2: Builder
# ===================================
FROM base AS builder

# Copiar package.json del frontend
COPY package.json ./

# Instalar todas las dependencias (incluyendo dev)
RUN pnpm install

# Copiar código fuente del frontend
COPY . .

# Construir la aplicación Next.js
RUN pnpm run build

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

# Copiar dependencias de producción desde stage deps
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar aplicación construida desde stage builder (frontend build)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public

# Exponer puerto
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3005 || exit 1

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]