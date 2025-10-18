# 🧪 Scripts - Microservicios Logística

Este directorio contiene scripts para el desarrollo y testing de la arquitectura de microservicios.

## 📁 Archivos Disponibles

### 🐳 Script Principal
- **`microservices.sh`** - Script maestro para gestión de microservicios

### 🧪 Scripts de Testing (Legacy)
- **`run-all-tests.sh`** - Script principal con menú interactivo para ejecutar todos los tests
- **`test-api-local.sh`** - Tests completos de la API local
- **`test-api-external.sh`** - Tests de la API externa
- **`test-api-internal.sh`** - Tests específicos de endpoints internos

## 🛠️ Uso

### 🐳 Gestión de Microservicios (Nuevo)

#### Iniciar todos los servicios
```bash
cd backend
./scripts/microservices.sh dev
```

#### Gestión individual de servicios
```bash
# Iniciar un servicio específico
./scripts/microservices.sh dev-service config-service

# Ver logs de un servicio
./scripts/microservices.sh logs-service shipping-service

# Ver estado de todos los servicios
./scripts/microservices.sh status

# Health check de todos los servicios
./scripts/microservices.sh health
```

#### Compilación y testing
```bash
# Compilar shared libraries y servicios
./scripts/microservices.sh build

# Ejecutar tests de todos los servicios
./scripts/microservices.sh test

# Limpiar containers y volúmenes
./scripts/microservices.sh clean
```

### 🧪 Scripts de Testing (Legacy)

#### Ejecutar Script Maestro
```bash
cd backend/scripts
./run-all-tests.sh
```

#### Tests Específicos
```bash
# Tests API Local
./test-api-local.sh

# Tests API Externa
export EXTERNAL_URL=https://tu-servidor.com
./test-api-external.sh

# Tests API Interna
./test-api-internal.sh
```

## 📋 Tests Incluidos

### 🏗️ Endpoints Internos (RF-001)
- ✅ `GET /config/transport-methods` - Listar métodos de transporte
- ✅ `POST /config/transport-methods` - Crear método de transporte
- ✅ `GET /config/transport-methods/:id` - Obtener método por ID
- ✅ `PATCH /config/transport-methods/:id` - Actualizar método
- ✅ `GET /config/coverage-zones` - Listar zonas de cobertura
- ✅ `POST /config/coverage-zones` - Crear zona de cobertura
- ✅ `GET /config/coverage-zones/:id` - Obtener zona por ID
- ✅ `PATCH /config/coverage-zones/:id` - Actualizar zona

### 🌐 Endpoints Externos (RF-001)
- ✅ `GET /transport-methods` - Listar métodos (endpoint externo) - **Datos reales de DB**
- ✅ `POST /shipping/cost` - Calcular costo de envío - **Lógica mock funcional**
- ✅ `POST /shipping` - Crear envío - **Lógica mock funcional**
- ✅ `GET /shipping` - Listar envíos - **Lógica mock funcional**
- ✅ `GET /shipping/:id` - Obtener envío por ID - **Lógica mock funcional**
- ✅ `POST /shipping/:id/cancel` - Cancelar envío - **Lógica mock funcional**

### ⚠️ Tests de Validación
- ✅ Datos inválidos
- ✅ Códigos duplicados
- ✅ Recursos inexistentes
- ✅ Validaciones de entrada

### ⚡ Tests de Performance
- ✅ Tiempo de respuesta de endpoints críticos
- ✅ Health check performance

## 🎯 Datos de Prueba

### Métodos de Transporte
Los scripts crean automáticamente:
- **Aéreo**: 800 km/h, 1-3 días, tarifas base
- **Terrestre**: 80 km/h, 3-7 días, tarifas base
- **Ferroviario**: 60 km/h, 5-10 días, tarifas base
- **Marítimo**: 30 km/h, 15-30 días, tarifas base

### Zonas de Cobertura
Los scripts crean automáticamente:
- **Buenos Aires Capital**: C1000-C1005
- **Gran Buenos Aires**: B1600-B1605
- **Córdoba Capital**: X5000-X5005
- **Rosario**: S2000-S2005
- **Mendoza Capital**: M5500-M5505

## 🔧 Requisitos

### Para Microservicios
- ✅ Docker y Docker Compose instalados
- ✅ Node.js 18+ y npm
- ✅ Puertos disponibles: 3001-3004, 5432, 6379

### Para Tests Legacy
- ✅ Servidor corriendo en `localhost:3004` (Operator Interface)
- ✅ Base de datos PostgreSQL conectada
- ✅ Dependencias instaladas (`npm install`)

### Herramientas Requeridas
- ✅ `docker` y `docker-compose` - Para orquestación
- ✅ `curl` - Para hacer requests HTTP
- ✅ `jq` - Para formatear JSON (opcional)
- ✅ `bash` - Para ejecutar scripts

## 📊 Resultados Esperados

### Tests Exitosos
```bash
✅ Status: 200
📄 Response: [datos JSON]
```

### Tests de Validación (Esperados)
```bash
❌ Status: 400/409/404
📄 Response: [mensaje de error]
```

### Performance
```bash
✅ Health check rápido
✅ Lista métodos rápida
✅ Lista zonas rápida
```

## 🚨 Troubleshooting

### Microservicios No Responden
```bash
# Verificar estado de servicios
./scripts/microservices.sh status

# Ver logs de todos los servicios
./scripts/microservices.sh logs

# Ver logs de un servicio específico
./scripts/microservices.sh logs-service config-service

# Health check
./scripts/microservices.sh health
```

### Errores de Docker
```bash
# Limpiar y reiniciar
./scripts/microservices.sh clean
./scripts/microservices.sh dev

# Verificar Docker
docker --version
docker-compose --version
```

### Errores de Permisos
```bash
# Hacer scripts ejecutables
chmod +x scripts/*.sh
```

### Problemas de Compilación
```bash
# Limpiar y recompilar
./scripts/microservices.sh clean
./scripts/microservices.sh build
```

## 📝 Logs y Debugging

### Ver Logs en Tiempo Real
```bash
# Todos los servicios
./scripts/microservices.sh logs

# Servicio específico
./scripts/microservices.sh logs-service shipping-service
```

### Ver Documentación API
- **Operator Interface**: http://localhost:3004/api/docs
- **Config Service**: http://localhost:3003/api/docs
- **Stock Integration**: http://localhost:3002/api/docs
- **Shipping Service**: http://localhost:3001/api/docs

### Debugging de Scripts
```bash
# Ejecutar con debug
bash -x scripts/microservices.sh dev
```

## 🎯 Arquitectura de Microservicios

Los scripts gestionan:
- ✅ **Microservicios**: 4 servicios independientes
- ✅ **Base de datos compartida**: PostgreSQL
- ✅ **Cache compartido**: Redis
- ✅ **Orchestration**: Docker Compose
- ✅ **Health checks**: Monitoreo automático
- ✅ **Development workflow**: Scripts unificados

### 📊 Puertos de Servicios

| Servicio | Puerto | Health Check |
|----------|--------|--------------|
| Operator Interface | 3004 | http://localhost:3004/health |
| Config Service | 3003 | http://localhost:3003/health |
| Stock Integration | 3002 | http://localhost:3002/health |
| Shipping Service | 3001 | http://localhost:3001/health |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |

---

**¡Happy Microservices Development! 🚀**
