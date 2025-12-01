# 📜 Documentación de Scripts - Microservicios

## 🎯 Descripción General

Esta carpeta contiene scripts automatizados para el manejo, construcción, testing y despliegue de los microservicios del sistema de logística. Todos los scripts están configurados para funcionar tanto en desarrollo local como en entornos de despliegue.

## 📁 Estructura de Archivos

```
scripts/
├── .env                      # Configuración personalizada 
├── README.md                 # Esta documentación
├── setup.sh                  # Script de setup inicial
├── build-shared.sh           # Script para construir librerías compartidas
├── microservices.sh          # Script principal de microservicios
├── operate-backend.sh        # Script de operación del backend
├── test-api-local.sh         # Script de testing local
├── test-api-external.sh      # Script de testing externo
├── test-api-internal.sh      # Script de testing interno
├── run-all-tests.sh          # Script para ejecutar todos los tests
├── testing-config.sh         # Configuración de testing
└── validate-stock-config.sh  # Validación de configuración de stock
```

## ⚙️ Configuración

### 1. Archivo de Configuración (.env)

Todos los scripts utilizan un archivo `.env` centralizado para la configuración. Para comenzar:

```bash
# Copiar configuración de ejemplo
cp scripts/env.example scripts/.env

# Editar configuración según tu entorno
nano scripts/.env
```

### 2. Variables de Entorno Principales

| Variable | Descripción | Desarrollo | Despliegue |
|----------|-------------|------------|------------|
| `ENVIRONMENT` | Entorno actual | `development` | `staging`/`production` |
| `CONFIG_SERVICE_URL` | URL del config service | `http://localhost:3003` | `http://config-service:3003` |
| `SHIPPING_SERVICE_URL` | URL del shipping service | `http://localhost:3001` | `http://shipping-service:3001` |
| `STOCK_INTEGRATION_SERVICE_URL` | URL del stock service | `http://localhost:3002` | `http://stock-integration-service:3002` |
| `OPERATOR_INTERFACE_SERVICE_URL` | URL del operator interface | `http://localhost:3004` | `http://operator-interface-service:3004` |

## 🚀 Scripts Disponibles

### 1. `setup.sh` - Setup Inicial

**Propósito**: Script de configuración inicial para preparar el entorno de desarrollo.

**Uso**:
```bash
# Setup completo
./scripts/setup.sh init

# Solo configurar .env
./scripts/setup.sh env

# Solo instalar dependencias
./scripts/setup.sh deps

# Solo construir librerías
./scripts/setup.sh build

# Solo ejecutar tests
./scripts/setup.sh test

# Validar configuración
./scripts/setup.sh validate

# Limpiar instalación
./scripts/setup.sh clean

# Setup forzado (sobrescribir configuración existente)
./scripts/setup.sh init --force

# Setup sin instalar dependencias
./scripts/setup.sh init --skip-deps
```

**Características**:
- ✅ Verificación automática de prerrequisitos
- ✅ Configuración automática de .env
- ✅ Instalación de dependencias
- ✅ Construcción de librerías compartidas
- ✅ Tests iniciales
- ✅ Validación de configuración

### 2. `build-shared.sh` - Construcción de Librerías Compartidas

**Propósito**: Construir las librerías compartidas (database, types, utils) que son utilizadas por todos los microservicios.

**Uso**:
```bash
# Construir todas las librerías
./scripts/build-shared.sh build

# Construir librería específica
./scripts/build-shared.sh build-database
./scripts/build-shared.sh build-types
./scripts/build-shared.sh build-utils

# Construir en paralelo
./scripts/build-shared.sh build --parallel

# Modo watch para desarrollo
./scripts/build-shared.sh watch

# Limpiar builds anteriores
./scripts/build-shared.sh clean

# Instalar dependencias
./scripts/build-shared.sh install

# Ejecutar tests
./scripts/build-shared.sh test

# Ver estado de builds
./scripts/build-shared.sh status
```

**Características**:
- ✅ Construcción incremental (solo reconstruye si hay cambios)
- ✅ Soporte para builds en paralelo
- ✅ Modo watch para desarrollo
- ✅ Validación de configuración
- ✅ Limpieza automática de builds anteriores

### 2. `microservices.sh` - Gestión de Microservicios

**Propósito**: Script principal para manejar todos los microservicios del sistema.

**Uso**:
```bash
# Iniciar todos los servicios en desarrollo
./scripts/microservices.sh dev

# Iniciar servicio específico
./scripts/microservices.sh dev-service config-service

# Detener todos los servicios
./scripts/microservices.sh stop

# Ver estado de servicios
./scripts/microservices.sh status

# Health check de todos los servicios
./scripts/microservices.sh health

# Ver logs de todos los servicios
./scripts/microservices.sh logs

# Ver logs de servicio específico
./scripts/microservices.sh logs-service shipping-service

# Ejecutar tests de todos los servicios
./scripts/microservices.sh test

# Limpiar containers y volúmenes
./scripts/microservices.sh clean
```

**Características**:
- ✅ Gestión completa de microservicios
- ✅ Health checks automáticos
- ✅ Logs centralizados
- ✅ Testing integrado
- ✅ Limpieza automática

### 3. `operate-backend.sh` - Operación del Backend

**Propósito**: Script simplificado para operaciones básicas del backend.

**Uso**:
```bash
# Instalar y construir todo
./scripts/operate-backend.sh install

# Construir servicios
./scripts/operate-backend.sh build

# Ejecutar tests
./scripts/operate-backend.sh test

# Iniciar en modo desarrollo
./scripts/operate-backend.sh start

# Detener procesos de desarrollo
./scripts/operate-backend.sh stop

# Docker compose up
./scripts/operate-backend.sh up

# Docker compose down
./scripts/operate-backend.sh down
```

### 4. `test-api-local.sh` - Testing Local

**Propósito**: Ejecutar tests completos de todos los microservicios en entorno local.

**Uso**:
```bash
# Ejecutar todos los tests
./scripts/test-api-local.sh

# El script automáticamente:
# - Verifica que los servicios estén activos
# - Ejecuta health checks
# - Prueba endpoints de cada servicio
# - Genera reporte de resultados
```

**Tests Incluidos**:
- ✅ Health checks de todos los servicios
- ✅ Config Service: transport methods, coverage zones
- ✅ Stock Integration Service: productos, reservas
- ✅ Shipping Service: cálculo de costos, creación de envíos
- ✅ Operator Interface Service: gestión de envíos

### 5. `testing-config.sh` - Configuración de Testing

**Propósito**: Configurar y validar el entorno de testing.

**Uso**:
```bash
# Mostrar configuración actual
source scripts/testing-config.sh show

# Validar configuración
source scripts/testing-config.sh validate

# Cargar configuración desde archivo
source scripts/testing-config.sh load .env.test

# Exportar variables de entorno
source scripts/testing-config.sh export
```

## 🔧 Configuración Avanzada

### Variables de Entorno por Entorno

#### Desarrollo Local
```bash
ENVIRONMENT=development
CONFIG_SERVICE_URL=http://localhost:3003
SHIPPING_SERVICE_URL=http://localhost:3001
# ... otras URLs locales
```

#### Despliegue
```bash
ENVIRONMENT=production
CONFIG_SERVICE_URL_DEPLOYED=http://config-service:3003
SHIPPING_SERVICE_URL_DEPLOYED=http://shipping-service:3001
# ... otras URLs de despliegue
```

### Configuración de Docker

Los scripts detectan automáticamente si están ejecutándose en un entorno Docker y ajustan las URLs correspondientes.

### Configuración de Testing

```bash
# Timeouts de testing
TEST_TIMEOUT=30000
TEST_RETRIES=3

# Configuración de health checks
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_RETRIES=3
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Script no encuentra archivo .env
```bash
# Solución: Crear archivo .env desde ejemplo
cp scripts/env.example scripts/.env
```

#### 2. Servicios no responden en health check
```bash
# Verificar que los servicios estén ejecutándose
./scripts/microservices.sh status

# Ver logs de servicios
./scripts/microservices.sh logs
```

#### 3. Error en build de librerías compartidas
```bash
# Limpiar builds anteriores
./scripts/build-shared.sh clean

# Reinstalar dependencias
./scripts/build-shared.sh install

# Reconstruir forzadamente
./scripts/build-shared.sh build --force
```

#### 4. Tests fallan
```bash
# Verificar configuración
source scripts/testing-config.sh validate

# Verificar que servicios estén activos
./scripts/microservices.sh health
```

### Logs y Debugging

#### Habilitar logs detallados
```bash
# Ejecutar con verbose
./scripts/build-shared.sh build --verbose

# Ver logs de servicios
./scripts/microservices.sh logs-service config-service
```

#### Verificar configuración
```bash
# Mostrar configuración actual
source scripts/testing-config.sh show

# Validar configuración
source scripts/testing-config.sh validate
```

## 📊 Monitoreo y Estado

### Health Checks

Todos los scripts incluyen health checks automáticos:

```bash
# Health check manual
./scripts/microservices.sh health

# Ver estado de servicios
./scripts/microservices.sh status
```

### Métricas de Testing

El script de testing genera reportes detallados:

```
📊 RESUMEN DE TESTING
=====================
Total de tests: 15
Tests exitosos: 14
Tests fallidos: 1
```

## 🔄 Flujo de Trabajo Recomendado

### Desarrollo Local

1. **Setup inicial** (recomendado):
   ```bash
   ./scripts/setup.sh init
   ```

   O manualmente:

2. **Configurar entorno**:
   ```bash
   cp scripts/env.example scripts/.env
   # Editar .env según necesidades
   ```

3. **Construir librerías compartidas**:
   ```bash
   ./scripts/build-shared.sh build
   ```

4. **Iniciar microservicios**:
   ```bash
   ./scripts/microservices.sh dev
   ```

5. **Ejecutar tests**:
   ```bash
   ./scripts/test-api-local.sh
   ```

### Despliegue

1. **Configurar para producción**:
   ```bash
   # Editar .env con URLs de despliegue
   ENVIRONMENT=production
   ```

2. **Construir y desplegar**:
   ```bash
   ./scripts/build-shared.sh build
   ./scripts/microservices.sh up
   ```

3. **Verificar despliegue**:
   ```bash
   ./scripts/microservices.sh health
   ```

## 📝 Notas de Desarrollo

### Actualización de Scripts

Los scripts están actualizados y funcionan con:
- ✅ Node.js 20+
- ✅ npm 10+
- ✅ Docker y Docker Compose
- ✅ Bash 4.0+

### Compatibilidad

- **macOS**: ✅ Totalmente compatible
- **Linux**: ✅ Totalmente compatible  
- **Windows**: ⚠️ Requiere WSL2 o Git Bash

### Dependencias Externas

- `curl`: Para health checks y testing
- `jq`: Para parsing de JSON (opcional)
- `fswatch`: Para modo watch (opcional)

## 🤝 Contribución

Para agregar nuevos scripts o modificar existentes:

1. Mantener compatibilidad con el archivo `.env`
2. Incluir documentación en este README
3. Agregar validación de configuración
4. Incluir manejo de errores
5. Probar en diferentes entornos

---

**Última actualización**: Diciembre 2025  
**Versión**: 1.0.0  
**Mantenido por**: Equipo TPI Desarrollo de Software
