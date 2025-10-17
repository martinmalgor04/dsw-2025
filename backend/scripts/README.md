# 🧪 Scripts de Testing - RF-001: Servicio de Configuración Base

Este directorio contiene scripts automatizados para probar la API del módulo de configuración implementado en RF-001.

## 📁 Archivos Disponibles

### 🚀 Script Maestro
- **`run-all-tests.sh`** - Script principal con menú interactivo para ejecutar todos los tests

### 🧪 Scripts de Testing
- **`test-api-local.sh`** - Tests completos de la API local (localhost:3000)
- **`test-api-external.sh`** - Tests de la API externa (servidor desplegado)
- **`test-api-internal.sh`** - Tests específicos de endpoints internos

## 🛠️ Uso

### Ejecutar Script Maestro (Recomendado)
```bash
cd backend/scripts
./run-all-tests.sh
```

### Ejecutar Tests Específicos

#### Tests API Local
```bash
cd backend/scripts
./test-api-local.sh
```

#### Tests API Externa
```bash
# Opción 1: Editar archivo de configuración
nano scripts/testing-config.sh
# Cambiar: EXTERNAL_URL=https://tu-servidor.com

# Opción 2: Variable de entorno
export EXTERNAL_URL=https://tu-servidor.com

# Ejecutar tests
cd backend/scripts
./test-api-external.sh
```

#### Tests API Interna
```bash
cd backend/scripts
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

### Para Tests Locales
- ✅ Servidor corriendo en `localhost:3000`
- ✅ Base de datos conectada
- ✅ Dependencias instaladas (`npm install`)

### Para Tests Externos
- ✅ Servidor desplegado y accesible
- ✅ Variable `EXTERNAL_URL` configurada
- ✅ Conectividad de red

### Herramientas Requeridas
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

### Servidor No Responde
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/health

# Si no responde, iniciar servidor
cd backend
npm run start:dev
```

### Tests Externos Fallan
```bash
# Verificar conectividad
curl https://tu-servidor.com/health

# Verificar configuración
echo $EXTERNAL_URL
```

### Errores de Permisos
```bash
# Hacer scripts ejecutables
chmod +x *.sh
```

## 📝 Logs y Debugging

### Ver Logs del Servidor
```bash
cd backend
npm run start:dev
```

### Ver Documentación API
- **Local**: http://localhost:3000/api/docs
- **Externa**: https://tu-servidor.com/api/docs

### Debugging de Scripts
```bash
# Ejecutar con debug
bash -x test-api-local.sh
```

## 🎯 RF-001: Criterios de Aceptación

Los scripts verifican:
- ✅ **CA001**: Configuración por ambiente
- ✅ **CA002**: Endpoints específicos funcionando
- ✅ **CA003**: Impacto en puntaje (Arquitectura + Acceso Datos)

---

**¡Happy Testing! 🚀**
