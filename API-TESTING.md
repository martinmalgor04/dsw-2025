# 🚀 API Testing - Logística Grupo 12

## 📋 **Índice**
- [🏠 Endpoints Generales](#-endpoints-generales)
- [💰 Cálculo de Costos](#-cálculo-de-costos)
- [🚛 Métodos de Transporte](#-métodos-de-transporte)
- [📦 Gestión de Envíos](#-gestión-de-envíos)
- [🔍 Consultas de Envíos](#-consultas-de-envíos)
- [❌ Cancelación de Envíos](#-cancelación-de-envíos)
- [🧪 Ejemplos Completos](#-ejemplos-completos)

---

## 🏠 **Endpoints Generales**

### **Health Check**
```bash
# Verificar estado de la API

```

### **Información de la API**
```bash
# Obtener información general
curl -X GET "http://144.22.130.30:3000/" \
  -H "Content-Type: application/json"
```

---

## 💰 **Cálculo de Costos**

### **Calcular Costo de Envío**
```bash
curl -X POST "http://144.22.130.30:3000/shipping/cost" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "quantity": 2
      },
      {
        "id": 2,
        "quantity": 1
      }
    ],
    "delivery_address": {
      "street": "Av. San Martín 1234",
      "city": "Rosario",
      "state": "Santa Fe",
      "postal_code": "S2000ABC",
      "country": "AR"
    }
  }'
```

### **Calcular Costo con Método Express**
```bash
curl -X POST "http://144.22.130.30:3000/shipping/cost" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "quantity": 1
      }
    ],
    "delivery_address": {
      "street": "Córdoba 567",
      "city": "Buenos Aires",
      "state": "CABA",
      "postal_code": "C1054ABC",
      "country": "AR"
    }
  }'
```

### **Calcular Costo con Múltiples Productos**
```bash
curl -X POST "http://144.22.130.30:3000/shipping/cost" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "quantity": 3
      },
      {
        "id": 2,
        "quantity": 2
      },
      {
        "id": 3,
        "quantity": 1
      }
    ],
    "delivery_address": {
      "street": "Mitre 890",
      "city": "Córdoba",
      "state": "Córdoba",
      "postal_code": "X5000ABC",
      "country": "AR"
    }
  }'
```

---

## 🚛 **Métodos de Transporte**

### **Obtener Métodos de Transporte Disponibles**
```bash
curl -X GET "http://144.22.130.30:3000/transport-methods" \
  -H "Content-Type: application/json"
```

---

## 📦 **Gestión de Envíos**

### **Crear Nuevo Envío**
```bash
curl -X POST "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "quantity": 2
      }
    ],
    "delivery_address": {
      "street": "San Martín 1234",
      "city": "Rosario",
      "state": "Santa Fe",
      "postal_code": "S2000ABC",
      "country": "AR"
    },
    "transport_type": "road",
    "user_id": 1,
    "order_id": 1
  }'
```

### **Crear Envío Express**
```bash
curl -X POST "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 2,
        "quantity": 1
      }
    ],
    "delivery_address": {
      "street": "Av. Corrientes 1234",
      "city": "Buenos Aires",
      "state": "CABA",
      "postal_code": "C1043ABC",
      "country": "AR"
    },
    "transport_type": "air",
    "user_id": 2,
    "order_id": 2
  }'
```

### **Crear Envío Premium con Múltiples Productos**
```bash
curl -X POST "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "quantity": 1
      },
      {
        "id": 3,
        "quantity": 2
      }
    ],
    "delivery_address": {
      "street": "Belgrano 567",
      "city": "Córdoba",
      "state": "Córdoba",
      "postal_code": "X5000ABC",
      "country": "AR"
    },
    "transport_type": "rail",
    "user_id": 3,
    "order_id": 3
  }'
```

---

## 🔍 **Consultas de Envíos**

### **Listar Todos los Envíos**
```bash
curl -X GET "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json"
```

### **Listar Envíos con Filtros**
```bash
# Filtrar por estado
curl -X GET "http://144.22.130.30:3000/shipping?status=pending" \
  -H "Content-Type: application/json"

# Filtrar por método de transporte
curl -X GET "http://144.22.130.30:3000/shipping?transport_method=express" \
  -H "Content-Type: application/json"

# Filtrar por fecha (ejemplo)
curl -X GET "http://144.22.130.30:3000/shipping?created_after=2025-01-01" \
  -H "Content-Type: application/json"

# Múltiples filtros
curl -X GET "http://144.22.130.30:3000/shipping?status=pending&transport_method=standard" \
  -H "Content-Type: application/json"
```

### **Obtener Detalles de un Envío Específico**
```bash
# Obtener detalles del envío ID 1
curl -X GET "http://144.22.130.30:3000/shipping/1" \
  -H "Content-Type: application/json"

# Obtener detalles del envío ID 2
curl -X GET "http://144.22.130.30:3000/shipping/2" \
  -H "Content-Type: application/json"
```

---

## ❌ **Cancelación de Envíos**

### **Cancelar Envío**
```bash
# Cancelar envío ID 1
curl -X POST "http://144.22.130.30:3000/shipping/1/cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Cliente solicitó cancelación",
    "cancelled_by": "customer"
  }'
```

### **Cancelar Envío por Administrador**
```bash
# Cancelar envío ID 2 por administrador
curl -X POST "http://144.22.130.30:3000/shipping/2/cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Producto no disponible en stock",
    "cancelled_by": "admin"
  }'
```

---

## 🧪 **Ejemplos Completos**

### **Flujo Completo: Calcular → Crear → Consultar → Cancelar**

#### **1. Calcular Costo**
```bash
curl -X POST "http://144.22.130.30:3000/shipping/cost" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "quantity": 1
      }
    ],
    "delivery_address": {
      "street": "San Martín 1234",
      "city": "Rosario",
      "state": "Santa Fe",
      "postal_code": "S2000ABC",
      "country": "AR"
    }
  }'
```

#### **2. Crear Envío**
```bash
curl -X POST "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "quantity": 1
      }
    ],
    "delivery_address": {
      "street": "San Martín 1234",
      "city": "Rosario",
      "state": "Santa Fe",
      "postal_code": "S2000ABC",
      "country": "AR"
    },
    "transport_type": "road",
    "user_id": 1,
    "order_id": 1
  }'
```

#### **3. Consultar Envío Creado**
```bash
# Usar el ID devuelto en el paso anterior
curl -X GET "http://144.22.130.30:3000/shipping/1" \
  -H "Content-Type: application/json"
```

#### **4. Cancelar Envío**
```bash
curl -X POST "http://144.22.130.30:3000/shipping/1/cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Cliente cambió de opinión",
    "cancelled_by": "customer"
  }'
```

---

## 🔧 **Configuración de Testing**

### **Variables de Entorno**
```bash
# Configurar URL base
export API_BASE_URL="http://144.22.130.30:3000"

# Ejemplo de uso con variable
curl -X GET "${API_BASE_URL}/health"
```

### **Headers Comunes**
```bash
# Con autenticación (cuando esté implementada)
curl -X GET "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Con headers personalizados
curl -X GET "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -H "X-Request-ID: req-12345"
```

---

## 📊 **Respuestas Esperadas**

### **Cálculo de Costo (200 OK)**
```json
{
  "total_cost": 1500.50,
  "breakdown": {
    "base_cost": 1000.00,
    "distance_cost": 300.00,
    "weight_cost": 200.50
  },
  "estimated_delivery_days": 3,
  "transport_method": "standard"
}
```

### **Crear Envío (201 Created)**
```json
{
  "shipping_id": 1,
  "tracking_number": "TRK-2025-001234",
  "status": "pending",
  "estimated_delivery": "2025-01-15",
  "total_cost": 1500.50
}
```

### **Listar Envíos (200 OK)**
```json
{
  "shipments": [
    {
      "shipping_id": 1,
      "tracking_number": "TRK-2025-001234",
      "status": "pending",
      "customer_name": "Juan Pérez",
      "destination_city": "Rosario",
      "transport_method": "standard",
      "created_at": "2025-01-10T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## 🚨 **Códigos de Error Comunes**

### **400 Bad Request**
```bash
# Producto no encontrado
curl -X POST "http://144.22.130.30:3000/shipping/cost" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 999,
        "quantity": 1
      }
    ],
    "delivery_address": {
      "street": "Test 123",
      "city": "Test City",
      "state": "Test",
      "postal_code": "T1234ABC",
      "country": "AR"
    }
  }'
```

### **404 Not Found**
```bash
# Envío no encontrado
curl -X GET "http://144.22.130.30:3000/shipping/999" \
  -H "Content-Type: application/json"
```

### **422 Unprocessable Entity**
```bash
# Datos inválidos
curl -X POST "http://144.22.130.30:3000/shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [],
    "delivery_address": {},
    "transport_type": "invalid"
  }'
```

---

## 📝 **Notas de Testing**

- ✅ **Servidor**: `144.22.130.30:3000`
- ✅ **Content-Type**: `application/json` para todos los POST
- ✅ **Mock Data**: La API usa datos simulados para testing
- ✅ **IDs**: Los envíos se crean con IDs incrementales (1, 2, 3...)
- ✅ **Tracking Numbers**: Se generan automáticamente con formato `TRK-YYYY-NNNNNN`

### **🏷️ Formato de Códigos Postales Argentinos**
La API requiere códigos postales en formato argentino: `LNNNNLLL`

**Ejemplos válidos:**
- `S2000ABC` - Rosario, Santa Fe
- `C1054ABC` - Buenos Aires, CABA  
- `X5000ABC` - Córdoba, Córdoba
- `H3500ABC` - Resistencia, Chaco

**Estructura:** `[Letra][4 dígitos][3 letras]`

### **🚛 Tipos de Transporte Disponibles**
- `road` - Transporte terrestre (estándar)
- `air` - Transporte aéreo (express)
- `rail` - Transporte ferroviario (premium)
- `sea` - Transporte marítimo (económico)

---

## 🎯 **Próximos Pasos**

1. **🔐 Implementar autenticación JWT**
2. **🗄️ Conectar con base de datos real**
3. **🌐 Integrar APIs externas (Stock, Distance)**
4. **📊 Agregar métricas y logging**
5. **🧪 Implementar tests automatizados**

---

**Desarrollado por:** Grupo 12 - TPI Desarrollo de Software 2025  
**Repositorio:** https://github.com/FRRe-DS/2025-12-TPI
