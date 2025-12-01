# 📡 Documentación de APIs - Visión General

> **📖 IMPORTANTE: Para documentación técnica completa y actualizada, ver:**  
> **[Backend API Documentation](../backend/docs/api/README.md)**
> 
> Esta es una guía general. La documentación detallada con ejemplos completos,  
> modelos de datos actualizados y testing está en `/backend/docs/api/README.md`.

---


## APIs Disponibles

### 1. API Externa (Pública)
**Archivo**: `openapilog.yaml`
**Descripción**: API para integración con sistemas externos (Portal de Compras, Stock)

**Endpoints principales**:
- `POST /shipping/cost` - Calcular costo de envío
- `POST /shipping` - Crear envío
- `GET /shipping` - Listar envíos
- `GET /shipping/:id` - Obtener envío
- `POST /shipping/:id/cancel` - Cancelar envío
- `GET /transport-methods` - Listar métodos de transporte

### 2. API Interna (Administración)
**Archivo**: `openapiint.yml`
**Descripción**: API para administración y configuración del sistema

**Endpoints principales**:
- `GET /config/transport-methods` - Listar métodos de transporte
- `POST /config/transport-methods` - Crear método de transporte
- `PATCH /config/transport-methods/:id` - Actualizar método
- `GET /config/coverage-zones` - Listar zonas de cobertura
- `POST /config/coverage-zones` - Crear zona de cobertura
- `PATCH /config/coverage-zones/:id` - Actualizar zona

## Especificaciones OpenAPI

### Swagger UI
- **Desarrollo**: http://localhost:3000/api/docs
- **Producción**: https://apilogistica.mmalgor.com.ar/api/docs

### Validación
- **Entrada**: DTOs con class-validator
- **Salida**: Tipos TypeScript generados
- **Errores**: Códigos HTTP/S estándares

## Autenticación

### Desarrollo
- Sin autenticación (modo desarrollo)

### Producción
- JWT tokens (futuro) (aun no al 06/11/2025)
- API keys para sistemas externos

## Rate Limiting

- **API Externa**: 100 requests/min por IP
- **API Interna**: 1000 requests/min por usuario

## Versionado

- **Actual**: v1.0.0

## Ejemplos de Uso

### Calcular Costo de Envío
```bash
curl -X POST http://localhost:3000/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "productId": 1,
        "quantity": 2,
        "weight": 1.5,
        "dimensions": {
          "length": 30,
          "width": 20,
          "height": 10
        }
      }
    ],
    "deliveryAddress": {
      "street": "Av. Corrientes 1234",
      "city": "Buenos Aires",
      "state": "CABA",
      "postalCode": "C1043",
      "country": "AR"
    }
  }'
```

### Crear Envío
```bash
curl -X POST http://localhost:3000/shipping \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 12345,
    "userId": 67890,
    "products": [...],
    "deliveryAddress": {...},
    "transportType": "road"
  }'
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso ya existe |
| 500 | Internal Server Error |

---

**Última actualización**: 6 de Noviembre de 2025