# ===================================
# DOCKERFILE - STOCK INTEGRATION SERVICE
# TPI Desarrollo de Software 2025
# Build context = service directory
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
# Stage 2: Builder
# ===================================
FROM base AS builder

# Copiar solo lo que necesitamos del servicio
COPY . .

# Build (asume que node_modules ya está)
# O instalar sin lock (menos reproducible)
RUN pnpm install --no-frozen-lockfile

# Compilar
RUN npm run build

# ===================================
# Stage 3: Production
# ===================================
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3002

# Copiar node_modules del builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar dist compilado
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copiar package.json para referencia
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Cambiar a usuario no-root
USER nestjs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
