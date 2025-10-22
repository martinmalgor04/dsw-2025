# Dockerfile para shipping-service
FROM node:18-alpine AS base

# Instalar herramientas básicas
RUN apk add --no-cache curl

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de configuración del workspace raíz
COPY package*.json ./
COPY tsconfig.json ./

# Copiar bibliotecas compartidas
COPY shared/ ./shared/

# Copiar configuración del servicio
COPY services/shipping-service/package*.json ./services/shipping-service/
COPY services/shipping-service/nest-cli.json ./services/shipping-service/
COPY services/shipping-service/tsconfig.json ./services/shipping-service/

# Etapa de desarrollo
FROM base AS development

# Instalar dependencias del workspace
RUN npm ci --legacy-peer-deps

# Instalar dependencias del servicio
WORKDIR /app/services/shipping-service
RUN npm ci --legacy-peer-deps

# Volver al directorio raíz y compilar shared libs
WORKDIR /app
RUN cd shared/database && npm run build
RUN cd shared/types && npm run build  
RUN cd shared/utils && npm run build

# Copiar código fuente del servicio
COPY services/shipping-service/src/ ./services/shipping-service/src/

# Establecer directorio de trabajo del servicio
WORKDIR /app/services/shipping-service

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD ["npm", "run", "start:dev"]