# Dockerfile para operator-interface-service
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
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

# Etapa de desarrollo
FROM base AS development

# Instalar dependencias del workspace
RUN npm ci --legacy-peer-deps

# Instalar TypeScript globalmente
RUN npm install -g typescript

# Compilar las bibliotecas compartidas primero
RUN cd shared/database && npm install && npm run build
RUN cd shared/utils && npm install && npm run build

# Instalar dependencias del servicio
WORKDIR /app
RUN npm ci --legacy-peer-deps

# Copiar código fuente del servicio
COPY src/ ./src/

# Establecer directorio de trabajo del servicio
WORKDIR /app

# Exponer puerto (usa la variable de entorno PORT o 3004 por defecto)
EXPOSE ${PORT:-3004}

# Comando por defecto (compila y luego ejecuta)
CMD ["sh", "-c", "npm run build && npm run start:prod"]