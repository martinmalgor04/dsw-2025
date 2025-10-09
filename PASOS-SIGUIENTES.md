# 🚀 PASOS SIGUIENTES - Setup del Proyecto

## ✅ Lo que ya está listo

- [x] Código implementado (controladores, servicios, DTOs)
- [x] Schema de Prisma configurado
- [x] Archivo .env creado
- [x] Dependencies en package.json
- [x] Seed script configurado

## ⚠️ Lo que falta hacer

### 1. Instalar Docker Desktop (PRIMERO)

Docker es necesario para ejecutar PostgreSQL y Redis.

**macOS:**
```bash
# Descargar e instalar Docker Desktop desde:
https://www.docker.com/products/docker-desktop/

# O con Homebrew:
brew install --cask docker

# Luego abrir la aplicación Docker Desktop
```

**Verificar instalación:**
```bash
docker --version
docker-compose --version
```

### 2. Instalar Dependencias de Node

```bash
npm install
```

### 3. Levantar Docker (PostgreSQL + Redis)

Una vez Docker Desktop esté instalado y corriendo:

```bash
# Levantar servicios
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps

# Ver logs
docker-compose logs -f postgres
```

### 4. Configurar Base de Datos con Prisma

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migración (crea las tablas)
npx prisma migrate dev --name init

# Poblar datos iniciales (métodos de transporte)
npx prisma db seed

# (Opcional) Ver datos en Prisma Studio
npx prisma studio
```

### 5. Ejecutar Aplicación

```bash
npm run start:dev
```

### 6. Probar Endpoints

```bash
# Health check
curl http://localhost:3000

# Obtener métodos de transporte
curl http://localhost:3000/shipping/transport-methods

# Calcular costo (POST)
curl -X POST http://localhost:3000/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_address": {
      "street": "Av. Dirac 1234",
      "city": "Resistencia",
      "state": "Chaco",
      "postal_code": "H3500ABC",
      "country": "AR"
    },
    "products": [
      {"id": 1, "quantity": 2}
    ]
  }'
```

## 🔧 Alternativa SIN Docker (PostgreSQL local)

Si no quieres usar Docker, puedes instalar PostgreSQL localmente:

**macOS con Homebrew:**
```bash
brew install postgresql@15
brew services start postgresql@15

# Crear usuario y base de datos
createuser logistica_user
createdb logistica_grupo12 -O logistica_user

# Actualizar .env con:
DATABASE_URL="postgresql://logistica_user@localhost:5432/logistica_grupo12?schema=public"
```

Luego continuar desde el paso 4.

## 📝 Resumen de Comandos (cuando Docker esté listo)

```bash
# Setup completo
docker-compose up -d
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

## 🆘 Si tienes problemas

### Error: "Cannot connect to database"
- Verifica que Docker Desktop esté corriendo
- Verifica que los puertos 5432 y 6379 no estén ocupados
- Intenta: `docker-compose down && docker-compose up -d`

### Error: "Prisma Client not generated"
- Ejecuta: `npx prisma generate`

### Error: "Module not found"
- Ejecuta: `npm install`

## 🎯 Estado Actual

```
[✅] Código implementado
[✅] .env creado
[⏳] Docker pendiente de instalar
[⏳] npm install pendiente
[⏳] Prisma setup pendiente
[⏳] Aplicación pendiente de ejecutar
```

## 📚 Links Útiles

- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Prisma Docs: https://www.prisma.io/docs/getting-started
- NestJS Docs: https://docs.nestjs.com/
