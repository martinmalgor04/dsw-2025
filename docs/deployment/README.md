# 🚀 Guías de Despliegue

## Entornos

### Desarrollo Local
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **Base de datos**: Supabase (desarrollo)
- **Cache**: Redis local

### Staging
- **Backend**: https://staging-api.logistica.com
- **Frontend**: https://staging.logistica.com
- **Base de datos**: Supabase (staging)
- **Cache**: Redis Cloud

### Producción
- **Backend**: https://api.logistica.com
- **Frontend**: https://logistica.com
- **Base de datos**: Supabase (producción)
- **Cache**: Redis Cloud

## Despliegue Local

### Prerrequisitos
- Node.js >= 18.x
- Docker & Docker Compose
- Git

### 1. Clonar Repositorio
```bash
git clone https://github.com/FRRe-DS/2025-12-TPI.git
cd 2025-12-TPI
```

### 2. Configurar Variables de Entorno

#### Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

#### Frontend
```bash
cd frontend
cp .env.example .env
# Editar .env con la URL del backend
```

### 3. Levantar Servicios
```bash
# PostgreSQL y Redis
docker-compose up -d

# Backend
cd backend
npm install
npx prisma generate
npm run start:dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

### 4. Verificar Despliegue
- **Backend**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:5173
- **Base de datos**: Verificar conexión en logs

## Despliegue con Docker

### 1. Build de Imágenes
```bash
# Backend
cd backend
docker build -t logistica-backend .

# Frontend
cd frontend
docker build -t logistica-frontend .
```

### 2. Docker Compose
```yaml
version: '3.8'
services:
  backend:
    image: logistica-backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  frontend:
    image: logistica-frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://backend:3000

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 3. Ejecutar
```bash
docker-compose up -d
```

## Despliegue en Producción

### 1. Preparar Entorno
```bash
# Configurar variables de entorno de producción
export NODE_ENV=production
export DATABASE_URL="postgresql://..."
export REDIS_URL="redis://..."
```

### 2. Build de Producción
```bash
# Backend
cd backend
npm ci --only=production
npm run build

# Frontend
cd frontend
npm ci
npm run build
```

### 3. Despliegue
```bash
# Usar tu plataforma preferida (Vercel, Netlify, etc.)
# o servidor propio con PM2
pm2 start ecosystem.config.js
```

## CI/CD Pipeline

### GitHub Actions

#### Workflow de Testing
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

#### Workflow de Deploy
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Scripts de despliegue
```

## Monitoreo

### Health Checks
```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost:5173
```

### Logs
```bash
# Backend logs
docker logs logistica-backend

# Frontend logs
docker logs logistica-frontend
```

### Métricas
- **Uptime**: Monitoreo de disponibilidad
- **Performance**: Tiempo de respuesta
- **Errores**: Rate de errores
- **Recursos**: CPU, memoria, disco

## Rollback

### Estrategia de Rollback
1. **Identificar versión estable**
2. **Revertir código**
3. **Re-desplegar**
4. **Verificar funcionalidad**

### Comandos de Rollback
```bash
# Git rollback
git revert <commit-hash>

# Docker rollback
docker-compose down
docker-compose up -d --scale backend=0
docker-compose up -d --scale backend=1
```

## Troubleshooting

### Problemas Comunes

#### Backend no inicia
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Verificar conexión a base de datos
npx prisma db pull

# Verificar logs
npm run start:dev
```

#### Frontend no carga
```bash
# Verificar build
npm run build

# Verificar variables de entorno
echo $VITE_API_URL

# Verificar conexión al backend
curl $VITE_API_URL/health
```

#### Base de datos no conecta
```bash
# Verificar credenciales
npx prisma db pull

# Verificar migraciones
npx prisma migrate status

# Reset de base de datos
npx prisma migrate reset
```

---

**Última actualización**: 16 de Octubre de 2025
