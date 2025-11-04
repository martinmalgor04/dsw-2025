# ===================================
# DOCKERFILE - OPERATOR INTERFACE SERVICE
# TPI Desarrollo de Software 2025
# Requiere pre-compilado:  pnpm run build
# ===================================

FROM node:20-alpine

RUN apk add --no-cache dumb-init openssl curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    npm install -g pnpm@latest

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3004

# Copiar TODOS los manifiestos del monorepo para que pnpm resuelva workspace: dependencies
COPY package.json pnpm-lock.yaml ./
COPY backend/services/*/package.json ./backend/services/
COPY backend/shared/*/package.json ./backend/shared/
COPY frontend/package.json ./frontend/

# Instalar todas las dependencias del monorepo
RUN pnpm install

# Copiar dist precompilado
COPY backend/services/operator-interface-service/dist ./dist

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
