# Dockerfile para config-service
FROM node:18-alpine AS base

# Instalar herramientas básicas y OpenSSL para Prisma
RUN apk add --no-cache \
    curl \
    openssl \
    openssl-dev \
    libc6-compat

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de configuración del workspace raíz
COPY package*.json ./
COPY tsconfig.json ./

# Copiar bibliotecas compartidas
COPY shared/ ./shared/

# Copiar configuración del servicio
COPY services/config-service/package*.json ./services/config-service/
COPY services/config-service/nest-cli.json ./services/config-service/
COPY services/config-service/tsconfig.json ./services/config-service/
COPY services/config-service/tsconfig.build.json ./services/config-service/

# Etapa de desarrollo
FROM base AS development

# Instalar dependencias del workspace
RUN npm ci --legacy-peer-deps

# Instalar TypeScript globalmente
RUN npm install -g typescript

# Instalar dependencias del servicio
WORKDIR /app/services/config-service
RUN npm ci --legacy-peer-deps

# Volver al directorio raíz
WORKDIR /app

# Compilar la biblioteca compartida de database
RUN cd shared/database && npm install && npm run build

# Copiar código fuente del servicio
COPY services/config-service/src/ ./services/config-service/src/

# Establecer directorio de trabajo del servicio
WORKDIR /app/services/config-service

# Exponer puerto (usa la variable de entorno PORT o 3003 por defecto)
EXPOSE ${PORT:-3003}

# Comando por defecto
CMD ["npm", "run", "start:dev"]