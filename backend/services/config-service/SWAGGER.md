# 📚 Documentación Swagger - Config Service

## Acceso a la Documentación

### Desarrollo Local
```
http://localhost:3003/api/docs
```

### Vía Gateway
```
http://localhost:3004/config/api/docs
```

## Descripción de la Aplicación

**Config Service API v1.0.0**

Configuration service for transport methods, coverage zones, tariff configurations, and fleet management. This service manages all configuration data for the logistics platform including transport methods, delivery coverage zones, pricing tiers, vehicles, drivers, and delivery routes.

**Contacto**: Grupo 12 - UTN FRRE
**Email**: grupo12@logistics.com
**GitHub**: https://github.com/grupos-12/logistica

## Endpoints por Categoría

### 📦 Configuration Management

#### Transport Methods
- **GET** `/config/transport-methods` - Listar todos los métodos de transporte
- **POST** `/config/transport-methods` - Crear nuevo método de transporte
- **GET** `/config/transport-methods/:id` - Obtener método por ID
- **PATCH** `/config/transport-methods/:id` - Actualizar método
- **DELETE** `/config/transport-methods/:id` - Eliminar método

#### Coverage Zones
- **GET** `/config/coverage-zones` - Listar todas las zonas de cobertura
- **POST** `/config/coverage-zones` - Crear nueva zona de cobertura
- **GET** `/config/coverage-zones/:id` - Obtener zona por ID
- **PATCH** `/config/coverage-zones/:id` - Actualizar zona
- **DELETE** `/config/coverage-zones/:id` - Eliminar zona

#### Tariff Configurations
- **GET** `/config/tariff-configs` - Listar todas las configuraciones de tarifa
- **GET** `/config/tariff-configs?transportMethodId=xxx` - Filtrar por método de transporte
- **POST** `/config/tariff-configs` - Crear nueva configuración de tarifa
- **GET** `/config/tariff-configs/:id` - Obtener tarifa por ID
- **PATCH** `/config/tariff-configs/:id` - Actualizar tarifa
- **DELETE** `/config/tariff-configs/:id` - Eliminar tarifa

### 🚚 Fleet Management

#### Vehicles
- **GET** `/fleet/vehicles` - Listar todos los vehículos
- **POST** `/fleet/vehicles` - Registrar nuevo vehículo
- **GET** `/fleet/vehicles/:id` - Obtener vehículo por ID
- **PATCH** `/fleet/vehicles/:id` - Actualizar vehículo
- **DELETE** `/fleet/vehicles/:id` - Eliminar vehículo

#### Drivers
- **GET** `/fleet/drivers` - Listar todos los conductores
- **POST** `/fleet/drivers` - Registrar nuevo conductor
- **GET** `/fleet/drivers/:id` - Obtener conductor por ID
- **PATCH** `/fleet/drivers/:id` - Actualizar conductor
- **DELETE** `/fleet/drivers/:id` - Eliminar conductor

#### Routes
- **GET** `/fleet/routes` - Listar todas las rutas
- **POST** `/fleet/routes` - Crear nueva ruta
- **GET** `/fleet/routes/:id` - Obtener ruta por ID
- **PATCH** `/fleet/routes/:id` - Actualizar ruta
- **DELETE** `/fleet/routes/:id` - Eliminar ruta

### ❤️ Health Checks

- **GET** `/health` - Verificar salud del servicio

## Ejemplos de Uso

### Crear un Método de Transporte

**Request:**
```bash
curl -X POST http://localhost:3003/config/transport-methods \
  -H "Content-Type: application/json" \
  -d '{
    "code": "air",
    "name": "Transporte Aéreo",
    "description": "Envío por vía aérea para urgencias",
    "averageSpeed": 800,
    "estimatedDays": "1-3",
    "baseCostPerKm": 0.8,
    "baseCostPerKg": 5.0,
    "isActive": true
  }'
```

**Response:**
```json
{
  "id": "tm-uuid-1234",
  "code": "air",
  "name": "Transporte Aéreo",
  "description": "Envío por vía aérea para urgencias",
  "averageSpeed": 800,
  "estimatedDays": "1-3",
  "baseCostPerKm": 0.8,
  "baseCostPerKg": 5.0,
  "isActive": true,
  "createdAt": "2025-11-03T16:00:00Z",
  "updatedAt": "2025-11-03T16:00:00Z"
}
```

### Registrar un Vehículo

**Request:**
```bash
curl -X POST http://localhost:3003/fleet/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "license_plate": "ABC-123-DEF",
    "make": "Volvo",
    "model": "FH16",
    "year": 2022,
    "capacityKg": 25000,
    "volumeM3": 85.5,
    "fuelType": "DIESEL",
    "status": "AVAILABLE"
  }'
```

**Response:**
```json
{
  "id": "vh-uuid-5678",
  "license_plate": "ABC-123-DEF",
  "make": "Volvo",
  "model": "FH16",
  "year": 2022,
  "capacityKg": 25000,
  "volumeM3": 85.5,
  "fuelType": "DIESEL",
  "status": "AVAILABLE",
  "createdAt": "2025-11-03T16:00:00Z",
  "updatedAt": "2025-11-03T16:00:00Z"
}
```

### Registrar un Conductor

**Request:**
```bash
curl -X POST http://localhost:3003/fleet/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP12345",
    "firstName": "Juan",
    "lastName": "García",
    "email": "juan.garcia@empresa.com",
    "phone": "+5493814123456",
    "licenseNumber": "LIC123456789",
    "licenseType": "C",
    "status": "ACTIVE"
  }'
```

**Response:**
```json
{
  "id": "dr-uuid-9012",
  "employeeId": "EMP12345",
  "firstName": "Juan",
  "lastName": "García",
  "email": "juan.garcia@empresa.com",
  "phone": "+5493814123456",
  "licenseNumber": "LIC123456789",
  "licenseType": "C",
  "status": "ACTIVE",
  "createdAt": "2025-11-03T16:00:00Z",
  "updatedAt": "2025-11-03T16:00:00Z"
}
```

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| **200** | OK - Operación exitosa |
| **201** | Created - Recurso creado exitosamente |
| **204** | No Content - Eliminación exitosa (sin contenido) |
| **400** | Bad Request - Validación fallida |
| **404** | Not Found - Recurso no encontrado |
| **409** | Conflict - Duplicado (ej: código de transporte ya existe) |
| **500** | Internal Server Error - Error del servidor |

## Validaciones

### Transport Method
- `code`: Requerido, 2-20 caracteres, ejemplo: "air"
- `name`: Requerido, 2-100 caracteres
- `averageSpeed`: Requerido, número entero >= 1 km/h
- `estimatedDays`: Requerido, máximo 20 caracteres, formato: "X-Y"
- `baseCostPerKm`: Requerido, número >= 0
- `baseCostPerKg`: Requerido, número >= 0

### Vehicle
- `license_plate`: Requerido, formato único
- `make`: Requerido, marca del vehículo
- `model`: Requerido, modelo del vehículo
- `year`: Requerido, año de fabricación
- `capacityKg`: Requerido, capacidad en kg > 0
- `volumeM3`: Requerido, volumen en m³ > 0
- `fuelType`: Requerido, uno de: DIESEL, GASOLINE, HYBRID, ELECTRIC
- `status`: Requerido, uno de: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE

### Driver
- `employeeId`: Requerido, ID único del empleado
- `firstName`: Requerido, 2+ caracteres
- `lastName`: Requerido, 2+ caracteres
- `email`: Requerido, email válido
- `phone`: Requerido, formato de teléfono
- `licenseNumber`: Requerido, número único de licencia
- `licenseType`: Requerido, uno de: A, B, C, D, E
- `status`: Requerido, uno de: ACTIVE, INACTIVE, SUSPENDED

## Performance

- **Timeout por request**: 5 segundos (configurable)
- **Reintentos automáticos**: Habilitados para GET (via gateway)
- **Rate limiting**: Implementado en gateway (100 requests/min por IP)

## Autenticación y Seguridad

- **JWT Authentication**: Implementado en gateway
- **CORS**: Habilitado para frontend en http://localhost:3000
- **Rate Limiting**: Por IP en el gateway
- **Request ID**: Tracking con X-Request-ID

## Logging

Todos los requests se registran con:
- Timestamp
- Request ID (UUID)
- Método HTTP
- Ruta
- Status Code
- Duración (ms)

Ejemplo de log:
```json
{
  "timestamp": "2025-11-03T16:00:00.123Z",
  "level": "info",
  "message": "✅ Response sent",
  "requestId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "method": "GET",
  "path": "/config/transport-methods",
  "status": 200,
  "durationMs": 45
}
```

## Integración con Gateway

Config Service está accesible a través del gateway en:

```
GET  http://localhost:3004/config/transport-methods
POST http://localhost:3004/config/transport-methods
GET  http://localhost:3004/fleet/vehicles
POST http://localhost:3004/fleet/drivers
```

El gateway proporciona:
- ✅ Service discovery automático
- ✅ Reintentos y circuit breaker
- ✅ Rate limiting
- ✅ Request correlation (X-Request-ID)
- ✅ Logging estructurado

## Herramientas Recomendadas

- **Swagger UI**: Interfaz web interactiva - http://localhost:3003/api/docs
- **Postman**: Cliente HTTP para testing - https://www.postman.com
- **cURL**: CLI para testing de API
- **Thunder Client**: Extension VS Code para testing

## Soporte y Documentación

- **Documentación General**: [README.md](../../README.md)
- **Guía de Gateway**: [GATEWAY.md](../operator-interface-service/GATEWAY.md)
- **Guía de Operación**: [OPERATE-BACKEND.md](../OPERATE-BACKEND.md)
- **Ejemplos de Logs**: [CORRELATED-LOGS-EXAMPLE.md](../CORRELATED-LOGS-EXAMPLE.md)

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
**Autor**: Grupo 12 - UTN FRRE
