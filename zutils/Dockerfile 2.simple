# ===================================
# DOCKERFILE SIMPLE PARA TESTING
# ===================================

FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Instalar dependencias de desarrollo necesarias
RUN npm install @nestjs/swagger @types/node --save-dev

# Instalar NestJS CLI globalmente
RUN npm install -g @nestjs/cli

# Copiar código fuente
COPY . .

# Remover archivos problemáticos
RUN rm -rf src/envio src/items prisma/seed.ts

# Compilar aplicación
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "start:prod"]
