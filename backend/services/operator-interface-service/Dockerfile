# ===================================
# DOCKERFILE - OPERATOR INTERFACE SERVICE
# Microservicio desacoplado
# Build context = monorepo root
# Enfoque: construcción y ejecución en un solo contenedor
# ===================================

FROM node:20-alpine

RUN apk add --no-cache \
    dumb-init \
    openssl \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 \
    && npm install -g pnpm@latest

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3004

# Copiar archivos de configuración del monorepo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copiar package.json de todos los servicios necesarios
COPY backend/services/operator-interface-service/package.json ./backend/services/operator-interface-service/
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/utils/package.json ./backend/shared/utils/
COPY backend/shared/database/package.json ./backend/shared/database/

# Instalar todas las dependencias
RUN pnpm install --ignore-scripts

# Copiar tsconfig raíz y código fuente
COPY backend/tsconfig.json ./backend/
COPY backend/services/operator-interface-service/src ./backend/services/operator-interface-service/src
COPY backend/services/operator-interface-service/tsconfig.json ./backend/services/operator-interface-service/
COPY backend/services/operator-interface-service/tsconfig.build.json* ./backend/services/operator-interface-service/
COPY backend/services/operator-interface-service/nest-cli.json ./backend/services/operator-interface-service/
COPY backend/shared/types/src ./backend/shared/types/src
COPY backend/shared/utils/src ./backend/shared/utils/src

# Compilar código TypeScript
WORKDIR /app/backend/services/operator-interface-service
RUN /app/node_modules/.bin/tsc -p tsconfig.json

# Cambiar usuario y configurar directorios
USER nestjs

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
