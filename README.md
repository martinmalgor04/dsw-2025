# 📦 Microservicio de Logística - Grupo 12

> **Trabajo Práctico Integrador - Desarrollo de Software 2025**  
> **UTN FRRE - Facultad Regional Resistencia**

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Levantar Docker (PostgreSQL + Redis)
docker-compose up -d

# Configurar base de datos
npx prisma generate
npx prisma migrate dev

# Ejecutar en desarrollo
npm run start:dev
```

## 📡 API Endpoints

### 1. Calcular Costo de Envío

**POST** `/shipping/cost`

Calcula el costo de envío sin crear ningún registro.

**Request Body:**
```json
{
  "delivery_address": {
    "street": "Av. Dirac 1234",
    "city": "Resistencia",
    "state": "Chaco",
    "postal_code": "H3500ABC",
    "country": "AR"
  },
  "products": [
    {
      "id": 1,
      "quantity": 2
    },
    {
      "id": 2,
      "quantity": 1
    }
  ]
}
```

**Response 200:**
```json
{
  "currency": "ARS",
  "total_cost": 45.5,
  "transport_type": "air",
  "products": [
    {
      "id": 1,
      "cost": 20.0
    },
    {
      "id": 2,
      "cost": 25.5
    }
  ]
}
```

---

### 2. Obtener Métodos de Transporte

**GET** `/shipping/transport-methods`

Retorna la lista de métodos de transporte disponibles.

**Response 200:**
```json
{
  "transport_methods": [
    {
      "type": "air",
      "name": "Air Freight",
      "estimated_days": "1-3"
    },
    {
      "type": "road",
      "name": "Road Transport",
      "estimated_days": "3-7"
    },
    {
      "type": "rail",
      "name": "Rail Freight",
      "estimated_days": "5-10"
    },
    {
      "type": "sea",
      "name": "Sea Freight",
      "estimated_days": "15-30"
    }
  ]
}
```

---

### 3. Crear Envío

**POST** `/shipping`

Crea un nuevo envío asociado a una orden.

**Request Body:**
```json
{
  "order_id": 123,
  "user_id": 456,
  "delivery_address": {
    "street": "Av. Siempre Viva 123",
    "city": "Resistencia",
    "state": "Chaco",
    "postal_code": "H3500ABC",
    "country": "AR"
  },
  "transport_type": "air",
  "products": [
    {
      "id": 1,
      "quantity": 1
    },
    {
      "id": 2,
      "quantity": 2
    }
  ]
}
```

**Response 201:**
```json
{
  "shipping_id": "uuid-123-456",
  "status": "created",
  "transport_type": "air",
  "estimated_delivery_at": "2025-10-01T00:00:00Z"
}
```

---

### 4. Listar Envíos

**GET** `/shipping`

Obtiene una lista paginada de envíos con filtros opcionales.

**Query Parameters:**
- `user_id` (opcional): Filtrar por ID de usuario
- `status` (opcional): Filtrar por estado (created, in_transit, delivered, etc.)
- `from_date` (opcional): Fecha desde (ISO 8601)
- `to_date` (opcional): Fecha hasta (ISO 8601)
- `page` (opcional, default: 1): Número de página
- `limit` (opcional, default: 20): Resultados por página

**Ejemplo:** `GET /shipping?user_id=456&status=in_transit&page=1&limit=20`

**Response 200:**
```json
{
  "shipments": [
    {
      "shipping_id": "uuid-123",
      "order_id": 123,
      "user_id": 456,
      "products": [
        {
          "product_id": 12,
          "quantity": 2
        }
      ],
      "status": "in_distribution",
      "transport_type": "air",
      "estimated_delivery_at": "2025-10-01T00:00:00Z",
      "created_at": "2025-09-01T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 87,
    "items_per_page": 20
  }
}
```

---

### 5. Obtener Detalle de Envío

**GET** `/shipping/:id`

Obtiene información completa de un envío específico, incluyendo historial de logs.

**Ejemplo:** `GET /shipping/uuid-123`

**Response 200:**
```json
{
  "shipping_id": "uuid-123",
  "order_id": 123,
  "user_id": 456,
  "delivery_address": {
    "street": "Av. Siempre Viva 123",
    "city": "Resistencia",
    "state": "Chaco",
    "postal_code": "H3500ABC",
    "country": "AR"
  },
  "departure_address": {
    "street": "Warehouse Central",
    "city": "Resistencia",
    "state": "Chaco",
    "postal_code": "H3500XYZ",
    "country": "AR"
  },
  "products": [
    {
      "product_id": 12,
      "quantity": 2
    }
  ],
  "status": "in_distribution",
  "transport_type": "air",
  "tracking_number": "LOG-AR-123456789",
  "carrier_name": "Express Logistics SA",
  "total_cost": 45.5,
  "currency": "ARS",
  "estimated_delivery_at": "2025-10-01T00:00:00Z",
  "created_at": "2025-09-01T10:00:00Z",
  "updated_at": "2025-09-15T09:29:00Z",
  "logs": [
    {
      "timestamp": "2025-09-15T09:29:00Z",
      "status": "in_distribution",
      "message": "Shipment is in distribution"
    },
    {
      "timestamp": "2025-09-01T10:00:00Z",
      "status": "created",
      "message": "Shipment created"
    }
  ]
}
```

---

### 6. Cancelar Envío

**POST** `/shipping/:id/cancel`

Cancela un envío. Solo se puede cancelar si está en estado `created` o `reserved`.

**Ejemplo:** `POST /shipping/uuid-123/cancel`

**Response 200:**
```json
{
  "shipping_id": "uuid-123",
  "status": "cancelled",
  "cancelled_at": "2025-09-18T19:00:00Z"
}
```

**Response 400 (Error):**
```json
{
  "code": "bad_request",
  "message": "Shipment cannot be cancelled. Current status 'in_transit' does not allow cancellation."
}
```

---

## 🗄️ Estados del Envío

- `created`: Envío creado
- `reserved`: Inventario reservado
- `in_transit`: En tránsito
- `arrived`: Llegó a destino
- `in_distribution`: En distribución local
- `delivered`: Entregado
- `cancelled`: Cancelado

---

## 🚚 Tipos de Transporte

- `air`: Aéreo (1-3 días)
- `road`: Terrestre (3-7 días)
- `rail`: Ferroviario (5-10 días)
- `sea`: Marítimo (15-30 días)

---

## 📄 Licencia

Apache-2.0

---

## 👥 Equipo

**Grupo 12 - Desarrollo de Software 2025 - UTN FRRE**

- [Integrantes del grupo]

---

**Repositorio:** https://github.com/FRRe-DS/2025-12-TPI
