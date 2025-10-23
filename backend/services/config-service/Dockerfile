# Dockerfile para config-service
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
# Nota: Saltamos la compilación de shared libs por ahora
# ya que no son críticas para el funcionamiento del Config Service
# RUN cd shared/database && tsc
# RUN cd shared/types && tsc  
# RUN cd shared/utils && tsc

# Copiar código fuente del servicio
COPY services/config-service/src/ ./services/config-service/src/

# Establecer directorio de trabajo del servicio
WORKDIR /app/services/config-service

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD ["npm", "run", "start:dev"]