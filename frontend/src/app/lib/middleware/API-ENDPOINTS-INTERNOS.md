# 🏗️ API Endpoints Internos - Arquitectura de Microservicios

Esta guía documenta todos los endpoints internos disponibles para el frontend utilizando la nueva arquitectura de microservicios.

## 📋 Información General

- **Base URL**: `http://localhost:3004` (Operator Interface Service)
- **Arquitectura**: Microservicios con BD compartida
- **Autenticación**: No requerida (endpoints internos)
- **Formato**: JSON
- **Métodos**: GET, POST, PATCH

## 🏗️ Arquitectura de Microservicios

```
Frontend (SvelteKit) → Middleware → Operator Interface Service (3004)
                                           ↓ HTTP calls
                            ┌─────────────────────────────────────┐
                            │ Config Service (3003)               │
                            │ Stock Integration Service (3002)     │
                            │ Shipping Service (3001)             │
                            └─────────────────────────────────────┘
                                           ↓
                                    PostgreSQL (BD Compartida)
```

**Importante**: El frontend se conecta únicamente al **Operator Interface Service (puerto 3004)**, que actúa como agregador y llama internamente a los otros microservicios según sea necesario.

### 🎯 Servicios Backend

| Servicio | Puerto | Función | Estado |
|----------|--------|---------|--------|
| Operator Interface | 3004 | API agregadora para frontend | ✅ Activo |
| Config Service | 3003 | Métodos transporte y zonas | ✅ Activo |
| Stock Integration | 3002 | Cliente HTTP para Stock externo | ✅ Activo |
| Shipping Service | 3001 | Lógica principal de envíos | ✅ Activo |

### 📦 Bibliotecas Compartidas

- **@logistics/database**: Cliente Prisma configurado
- **@logistics/types**: DTOs y tipos compartidos  
- **@logistics/utils**: HTTP client y utilidades

---

## 🚚 Métodos de Transporte

### **GET** `/config/transport-methods`
**Descripción**: Lista todos los métodos de transporte disponibles

**Respuesta**:
```json
[
  {
    "id": "uuid",
    "code": "air",
    "name": "Aéreo",
    "description": "Transporte aéreo para envíos urgentes",
    "averageSpeed": 800,
    "estimatedDays": "1-3",
    "baseCostPerKm": "0.80",
    "baseCostPerKg": "5.00",
    "isActive": true,
    "createdAt": "2025-10-17T00:00:00.000Z",
    "updatedAt": "2025-10-17T00:00:00.000Z",
    "tariffConfigs": []
  }
]
```

**Campos**:
- `id`: UUID único del método
- `code`: Código identificador (air, road, rail, sea)
- `name`: Nombre descriptivo
- `description`: Descripción detallada
- `averageSpeed`: Velocidad promedio en km/h
- `estimatedDays`: Rango de días estimados (ej: "1-3")
- `baseCostPerKm`: Costo base por kilómetro
- `baseCostPerKg`: Costo base por kilogramo
- `isActive`: Si está disponible para uso
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización
- `tariffConfigs`: Configuraciones de tarifas (array vacío por ahora)

---

### **POST** `/config/transport-methods`
**Descripción**: Crea un nuevo método de transporte

**Body**:
```json
{
  "code": "air",
  "name": "Aéreo",
  "description": "Transporte aéreo para envíos urgentes",
  "averageSpeed": 800,
  "estimatedDays": "1-3",
  "baseCostPerKm": 0.8,
  "baseCostPerKg": 5.0,
  "isActive": true
}
```

**Validaciones**:
- `code`: Requerido, único, 2-20 caracteres
- `name`: Requerido, 2-100 caracteres
- `description`: Opcional, texto libre
- `averageSpeed`: Requerido, entero positivo
- `estimatedDays`: Requerido, máximo 20 caracteres
- `baseCostPerKm`: Requerido, número positivo
- `baseCostPerKg`: Requerido, número positivo
- `isActive`: Opcional, boolean (default: true)

**Respuesta** (201 Created):
```json
{
  "id": "uuid",
  "code": "air",
  "name": "Aéreo",
  "description": "Transporte aéreo para envíos urgentes",
  "averageSpeed": 800,
  "estimatedDays": "1-3",
  "baseCostPerKm": "0.80",
  "baseCostPerKg": "5.00",
  "isActive": true,
  "createdAt": "2025-10-17T00:00:00.000Z",
  "updatedAt": "2025-10-17T00:00:00.000Z",
  "tariffConfigs": []
}
```

**Errores**:
- `400`: Datos inválidos
- `409`: Código ya existe

---

### **GET** `/config/transport-methods/:id`
**Descripción**: Obtiene un método de transporte específico por ID

**Parámetros**:
- `id`: UUID del método de transporte

**Respuesta** (200 OK):
```json
{
  "id": "uuid",
  "code": "air",
  "name": "Aéreo",
  "description": "Transporte aéreo para envíos urgentes",
  "averageSpeed": 800,
  "estimatedDays": "1-3",
  "baseCostPerKm": "0.80",
  "baseCostPerKg": "5.00",
  "isActive": true,
  "createdAt": "2025-10-17T00:00:00.000Z",
  "updatedAt": "2025-10-17T00:00:00.000Z",
  "tariffConfigs": []
}
```

**Errores**:
- `404`: Método no encontrado

---

### **PATCH** `/config/transport-methods/:id`
**Descripción**: Actualiza un método de transporte existente

**Parámetros**:
- `id`: UUID del método de transporte

**Body** (campos opcionales):
```json
{
  "name": "Aéreo Actualizado",
  "description": "Nueva descripción",
  "averageSpeed": 850,
  "estimatedDays": "1-2",
  "baseCostPerKm": 0.9,
  "baseCostPerKg": 5.5,
  "isActive": false
}
```

**Respuesta** (200 OK):
```json
{
  "id": "uuid",
  "code": "air",
  "name": "Aéreo Actualizado",
  "description": "Nueva descripción",
  "averageSpeed": 850,
  "estimatedDays": "1-2",
  "baseCostPerKm": "0.90",
  "baseCostPerKg": "5.50",
  "isActive": false,
  "createdAt": "2025-10-17T00:00:00.000Z",
  "updatedAt": "2025-10-17T00:00:00.000Z",
  "tariffConfigs": []
}
```

**Errores**:
- `400`: Datos inválidos
- `404`: Método no encontrado

---

## 🗺️ Zonas de Cobertura

### **GET** `/config/coverage-zones`
**Descripción**: Lista todas las zonas de cobertura disponibles

**Respuesta**:
```json
[
  {
    "id": "uuid",
    "name": "Buenos Aires Capital",
    "description": "Capital Federal y zonas aledañas",
    "postalCodes": ["C1000", "C1001", "C1002", "C1003", "C1004", "C1005"],
    "isActive": true,
    "createdAt": "2025-10-17T00:00:00.000Z",
    "updatedAt": "2025-10-17T00:00:00.000Z"
  }
]
```

**Campos**:
- `id`: UUID único de la zona
- `name`: Nombre de la zona
- `description`: Descripción detallada
- `postalCodes`: Array de códigos postales
- `isActive`: Si está disponible para uso
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

---

### **POST** `/config/coverage-zones`
**Descripción**: Crea una nueva zona de cobertura

**Body**:
```json
{
  "name": "Buenos Aires Capital",
  "description": "Capital Federal y zonas aledañas",
  "postalCodes": ["C1000", "C1001", "C1002", "C1003", "C1004", "C1005"],
  "isActive": true
}
```

**Validaciones**:
- `name`: Requerido, 2-100 caracteres
- `description`: Opcional, texto libre
- `postalCodes`: Requerido, array no vacío de strings
- `isActive`: Opcional, boolean (default: true)

**Respuesta** (201 Created):
```json
{
  "id": "uuid",
  "name": "Buenos Aires Capital",
  "description": "Capital Federal y zonas aledañas",
  "postalCodes": ["C1000", "C1001", "C1002", "C1003", "C1004", "C1005"],
  "isActive": true,
  "createdAt": "2025-10-17T00:00:00.000Z",
  "updatedAt": "2025-10-17T00:00:00.000Z"
}
```

**Errores**:
- `400`: Datos inválidos

---

### **GET** `/config/coverage-zones/:id`
**Descripción**: Obtiene una zona de cobertura específica por ID

**Parámetros**:
- `id`: UUID de la zona de cobertura

**Respuesta** (200 OK):
```json
{
  "id": "uuid",
  "name": "Buenos Aires Capital",
  "description": "Capital Federal y zonas aledañas",
  "postalCodes": ["C1000", "C1001", "C1002", "C1003", "C1004", "C1005"],
  "isActive": true,
  "createdAt": "2025-10-17T00:00:00.000Z",
  "updatedAt": "2025-10-17T00:00:00.000Z"
}
```

**Errores**:
- `404`: Zona no encontrada

---

### **PATCH** `/config/coverage-zones/:id`
**Descripción**: Actualiza una zona de cobertura existente

**Parámetros**:
- `id`: UUID de la zona de cobertura

**Body** (campos opcionales):
```json
{
  "name": "Buenos Aires Capital Actualizada",
  "description": "Nueva descripción",
  "postalCodes": ["C1000", "C1001", "C1002", "C1003", "C1004", "C1005", "C1006"],
  "isActive": false
}
```

**Respuesta** (200 OK):
```json
{
  "id": "uuid",
  "name": "Buenos Aires Capital Actualizada",
  "description": "Nueva descripción",
  "postalCodes": ["C1000", "C1001", "C1002", "C1003", "C1004", "C1005", "C1006"],
  "isActive": false,
  "createdAt": "2025-10-17T00:00:00.000Z",
  "updatedAt": "2025-10-17T00:00:00.000Z"
}
```

**Errores**:
- `400`: Datos inválidos
- `404`: Zona no encontrada

---

## 🏥 Health Check

### **GET** `/health`
**Descripción**: Verifica el estado del servidor

**Respuesta** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-10-17T00:00:00.000Z",
  "service": "Logística API",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 📝 Códigos de Error Comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| `400` | Bad Request | Verificar formato de datos enviados |
| `404` | Not Found | Verificar que el ID existe |
| `409` | Conflict | El código ya existe (solo para transport-methods) |
| `500` | Internal Server Error | Error del servidor, contactar soporte |

---

## 🔧 Ejemplos de Uso

### Crear un método de transporte completo:
```bash
curl -X POST http://localhost:3004/config/transport-methods \
  -H "Content-Type: application/json" \
  -d '{
    "code": "express",
    "name": "Express",
    "description": "Servicio express para envíos urgentes",
    "averageSpeed": 1000,
    "estimatedDays": "1",
    "baseCostPerKm": 2.0,
    "baseCostPerKg": 10.0,
    "isActive": true
  }'
```

### Crear una zona de cobertura:
```bash
curl -X POST http://localhost:3004/config/coverage-zones \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Córdoba Capital",
    "description": "Ciudad de Córdoba y alrededores",
    "postalCodes": ["X5000", "X5001", "X5002"],
    "isActive": true
  }'
```

### Actualizar un método existente:
```bash
curl -X PATCH http://localhost:3004/config/transport-methods/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

---

## 📚 Documentación Adicional

- **Swagger UI**: `http://localhost:3004/api/docs`
- **Tests**: Ver `backend/scripts/microservices.sh` para scripts de testing
- **Schema**: Ver `backend/shared/database/prisma/schema.prisma` para estructura de DB
- **Gestión**: Ver `backend/README-MICROSERVICES.md` para comandos de desarrollo

---

**🎯 RF-001: Servicio de Configuración Base - Endpoints Internos**
