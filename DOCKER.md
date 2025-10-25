# 🐳 Documentación Docker - Sistema de Logística

## 🎯 Descripción General

Esta documentación explica cómo usar Docker para el sistema de logística, incluyendo microservicios backend y frontend Next.js.

## 📁 Estructura de Dockerfiles

```
├── backend/
│   ├── services/
│   │   ├── config-service/Dockerfile
│   │   ├── stock-integration-service/Dockerfile
│   │   ├── shipping-service/Dockerfile
│   │   └── operator-interface-service/Dockerfile
│   └── shared/ (librerías compartidas)
├── frontend/Dockerfile
├── docker-compose.yml (producción)
├── docker-compose.dev.yml (desarrollo)
└── scripts/docker.sh
```

## 🚀 Comandos Rápidos

### **Desarrollo Local**
```bash
# Levantar servicios de desarrollo
./scripts/docker.sh up-dev

# Ver logs
./scripts/docker.sh logs

# Ver estado
./scripts/docker.sh status
```

### **Producción**
```bash
# Construir todas las imágenes
./scripts/docker.sh build

# Levantar servicios de producción
./scripts/docker.sh up

# Verificar health
./scripts/docker.sh health
```

## 🏗️ Construcción de Imágenes

### **Construir Todas las Imágenes**
```bash
./scripts/docker.sh build
```

### **Construir Imagen Específica**
```bash
# Microservicios
./scripts/docker.sh build-service config-service
./scripts/docker.sh build-service stock-integration-service
./scripts/docker.sh build-service shipping-service
./scripts/docker.sh build-service operator-interface-service

# Frontend
./scripts/docker.sh build-service frontend
```

### **Construcción Manual**
```bash
# Microservicio
cd backend
docker build -f services/config-service/Dockerfile -t logistics-config-service:latest .

# Frontend
cd frontend
docker build -t logistics-frontend:latest .
```

## 🐳 Docker Compose

### **Desarrollo Local**
```bash
# Levantar servicios de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Detener servicios
docker-compose -f docker-compose.dev.yml down
```

### **Producción**
```bash
# Levantar servicios de producción
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## 📊 Servicios Disponibles

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **postgres** | 5432 | Base de datos PostgreSQL |
| **redis** | 6379 | Cache Redis |
| **config-service** | 3003 | Servicio de configuración |
| **stock-integration-service** | 3002 | Servicio de integración de stock |
| **shipping-service** | 3001 | Servicio de envíos |
| **operator-interface-service** | 3004 | API Gateway |
| **frontend** | 80 | Frontend Next.js |

## 🔧 Configuración

### **Variables de Entorno**

#### **Base de Datos**
```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/logistics
DIRECT_URL=postgresql://postgres:postgres@postgres:5432/logistics
```

#### **Redis**
```bash
REDIS_URL=redis://redis:6379
```

#### **Microservicios**
```bash
CONFIG_SERVICE_URL=http://config-service:3003
STOCK_INTEGRATION_SERVICE_URL=http://stock-integration-service:3002
SHIPPING_SERVICE_URL=http://shipping-service:3001
OPERATOR_INTERFACE_SERVICE_URL=http://operator-interface-service:3004
```

#### **Frontend**
```bash
NEXT_PUBLIC_API_URL=http://operator-interface-service:3004
NEXT_PUBLIC_OPERATOR_URL=http://operator-interface-service:3004
NEXT_PUBLIC_CONFIG_URL=http://config-service:3003
NEXT_PUBLIC_SHIPPING_URL=http://shipping-service:3001
NEXT_PUBLIC_STOCK_URL=http://stock-integration-service:3002
```

## 🏥 Health Checks

Todos los servicios incluyen health checks automáticos:

```bash
# Verificar health de todos los servicios
./scripts/docker.sh health

# Verificar health manual
curl http://localhost:3001/health  # Shipping Service
curl http://localhost:3002/health  # Stock Integration Service
curl http://localhost:3003/health  # Config Service
curl http://localhost:3004/health  # Operator Interface Service
curl http://localhost:80           # Frontend
```

## 📝 Logs y Debugging

### **Ver Logs**
```bash
# Todos los servicios
./scripts/docker.sh logs

# Servicio específico
./scripts/docker.sh logs-service frontend
./scripts/docker.sh logs-service config-service
```

### **Debugging**
```bash
# Abrir shell en servicio
./scripts/docker.sh shell postgres
./scripts/docker.sh shell config-service

# Ver estado detallado
./scripts/docker.sh status
```

## 🧹 Limpieza

### **Limpiar Docker**
```bash
# Limpiar containers, imágenes y volúmenes
./scripts/docker.sh clean

# Limpiar manualmente
docker system prune -a
docker volume prune
```

### **Reiniciar Servicios**
```bash
# Reiniciar todos los servicios
./scripts/docker.sh restart

# Detener y levantar
./scripts/docker.sh down
./scripts/docker.sh up
```

## 🔄 Flujos de Trabajo

### **Desarrollo Local**
1. **Setup inicial**:
   ```bash
   ./scripts/docker.sh up-dev
   ```

2. **Desarrollo**:
   ```bash
   # Ver logs en tiempo real
   ./scripts/docker.sh logs
   
   # Abrir shell para debugging
   ./scripts/docker.sh shell config-service
   ```

3. **Testing**:
   ```bash
   # Verificar health
   ./scripts/docker.sh health
   
   # Ejecutar tests
   ./scripts/test-api-local.sh
   ```

### **Despliegue en Producción**
1. **Construir imágenes**:
   ```bash
   ./scripts/docker.sh build
   ```

2. **Desplegar**:
   ```bash
   ./scripts/docker.sh up
   ```

3. **Verificar**:
   ```bash
   ./scripts/docker.sh health
   ```

## 🚨 Troubleshooting

### **Problemas Comunes**

#### **Servicios no inician**
```bash
# Ver logs del servicio
./scripts/docker.sh logs-service <servicio>

# Verificar estado
./scripts/docker.sh status

# Reiniciar servicio
docker-compose restart <servicio>
```

#### **Problemas de conectividad**
```bash
# Verificar red
docker network ls
docker network inspect logistics-network

# Verificar DNS
./scripts/docker.sh shell config-service
nslookup postgres
```

#### **Problemas de base de datos**
```bash
# Conectar a PostgreSQL
./scripts/docker.sh shell postgres
psql -U postgres -d logistics

# Verificar Redis
./scripts/docker.sh shell redis
redis-cli ping
```

#### **Problemas de memoria**
```bash
# Ver uso de recursos
docker stats

# Limpiar sistema
./scripts/docker.sh clean
```

### **Logs Específicos**

#### **PostgreSQL**
```bash
docker-compose logs postgres
```

#### **Redis**
```bash
docker-compose logs redis
```

#### **Microservicios**
```bash
docker-compose logs config-service
docker-compose logs stock-integration-service
docker-compose logs shipping-service
docker-compose logs operator-interface-service
```

#### **Frontend**
```bash
docker-compose logs frontend
```

## 📊 Monitoreo

### **Métricas de Contenedores**
```bash
# Ver uso de recursos
docker stats

# Ver información detallada
docker-compose ps
```

### **Logs Centralizados**
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico con timestamps
docker-compose logs -f -t config-service
```

## 🔐 Seguridad

### **Usuarios No-Root**
Todos los servicios ejecutan con usuarios no-root:
- **Microservicios**: `nestjs` (UID 1001)
- **Frontend**: `nextjs` (UID 1001)

### **Redes Aisladas**
- Red dedicada: `logistics-network`
- Subnet: `172.20.0.0/16`

### **Volúmenes Persistentes**
- `postgres_data`: Datos de PostgreSQL
- `redis_data`: Datos de Redis

## 📈 Optimizaciones

### **Multi-Stage Builds**
Todos los Dockerfiles usan multi-stage builds para:
- Reducir tamaño de imagen final
- Mejorar seguridad
- Optimizar cache de Docker

### **Health Checks**
- Intervalo: 30s
- Timeout: 10s
- Retries: 3
- Start period: 40s

### **Restart Policies**
- `unless-stopped`: Reinicia automáticamente excepto cuando se detiene manualmente

---

**Última actualización**: Diciembre 2025  
**Versión**: 1.0.0  
**Mantenido por**: Equipo TPI Desarrollo de Software
