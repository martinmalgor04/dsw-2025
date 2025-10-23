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
COPY services/operator-interface-service/package*.json ./services/operator-interface-service/
COPY services/operator-interface-service/nest-cli.json ./services/operator-interface-service/
COPY services/operator-interface-service/tsconfig.json ./services/operator-interface-service/
COPY services/operator-interface-service/tsconfig.build.json ./services/operator-interface-service/

# Etapa de desarrollo
FROM base AS development

# Instalar dependencias del workspace
RUN npm ci --legacy-peer-deps

# Instalar TypeScript globalmente
RUN npm install -g typescript

# Instalar dependencias del servicio
WORKDIR /app/services/operator-interface-service
RUN npm ci --legacy-peer-deps

# Volver al directorio raíz
WORKDIR /app

# Compilar la biblioteca compartida de database
RUN cd shared/database && npm install && npm run build

# Copiar código fuente del servicio
COPY services/operator-interface-service/src/ ./services/operator-interface-service/src/

# Establecer directorio de trabajo del servicio
WORKDIR /app/services/operator-interface-service

# Exponer puerto (usa la variable de entorno PORT o 3004 por defecto)
EXPOSE ${PORT:-3004}

# Comando por defecto
CMD ["npm", "run", "start:dev"]