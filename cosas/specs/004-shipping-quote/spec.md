# 📋 RF-003: Servicio de Cotización - Especificación Técnica

## 🎯 Visión General

Implementar el endpoint `POST /shipping/cost` que calcule el costo de envío consultando datos de productos desde el módulo Stock, aplicando reglas de negocio de peso volumétrico, distancia y tarifas configuradas.

## 📊 Criterios de Aceptación

- ✅ Endpoint `POST /shipping/cost` según OpenAPI
- ✅ Consulta peso, dimensiones y depósito por producto a Stock
- ✅ Cálculo de peso volumétrico con factor configurable
- ✅ Peso facturable = max(peso real, peso volumétrico)
- ✅ Cálculo de distancia entre depósito y destino
- ✅ Aplicación de tarifas: base + (peso × tarifa/kg) + (distancia × tarifa/km)
- ✅ Validación de zona de cobertura antes de cotizar
- ✅ Respuesta en menos de 3 segundos
- ✅ Caché de productos para reducir llamadas a Stock
- ✅ Flag "estimated" si se usan valores por defecto por timeout

## 🏗️ Arquitectura

### Flujo de Cotización

```
1. Cliente → POST /shipping/cost
2. Validar DTO (delivery_address + products[])
3. Para cada producto:
   a. Consultar Stock API (con caché)
   b. Obtener peso, dimensiones, depósito
4. Calcular peso volumétrico total
5. Calcular peso facturable
6. Calcular distancia (depósito → destino)
7. Validar zona de cobertura
8. Aplicar tarifas según método de transporte
9. Retornar cotización con breakdown por producto
```

### Componentes

- **ShippingQuoteController**: Endpoint REST
- **ShippingQuoteService**: Lógica de negocio
- **ProductDataService**: Consulta a Stock (con caché)
- **DistanceCalculationService**: Cálculo de distancias
- **TariffCalculationService**: Aplicación de tarifas
- **CoverageValidationService**: Validación de zonas
- **PostalCodeValidationService**: Validación de códigos postales argentinos

## 📝 DTOs y Esquemas

### Request (ShippingCostRequest)
```typescript
{
  delivery_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string; // Formato: H3500ABC
    country: string;
  };
  products: Array<{
    id: number;
    quantity: number;
  }>;
}
```

### Response (ShippingCostResponse)
```typescript
{
  currency: "ARS";
  total_cost: number;
  transport_type: "road" | "air" | "sea";
  products: Array<{
    id: number;
    cost: number;
  }>;
  estimated?: boolean; // Flag si se usaron datos por defecto
  breakdown?: {
    base_cost: number;
    weight_cost: number;
    distance_cost: number;
    total_weight: number;
    volumetric_weight: number;
    billable_weight: number;
    distance_km: number;
  };
}
```

## 🔧 Lógica de Negocio

### 1. Consulta de Productos
```typescript
// Para cada producto en la request
const productData = await stockIntegration.getProductById(productId);
// Retorna: { pesoKg, dimensiones: {largoCm, anchoCm, altoCm}, ubicacion: {postal_code} }
```

### 2. Cálculo de Peso Volumétrico
```typescript
// Obtener factor volumétrico desde TariffConfig (RF-001)
const tariffConfig = await getTariffConfig(transportType);
const volumetricFactor = tariffConfig.volumetricFactor; // kg/m³ (desde BD)
const volume = (largo * ancho * alto) / 1000000; // m³
const volumetricWeight = volume * volumetricFactor;
```

### 3. Peso Facturable
```typescript
const billableWeight = Math.max(realWeight, volumetricWeight);
```

### 4. Cálculo de Distancia
```typescript
// Usar API de geocoding o servicio de mapas
const distance = await distanceService.calculate(
  warehousePostalCode,
  deliveryPostalCode
);
```

### 5. Aplicación de Tarifas
```typescript
// Obtener configuración de tarifas desde BD (RF-001)
const tariffConfig = await configService.getTariffConfig(transportType);
const cost = tariffConfig.baseTariff + 
             (billableWeight * tariffConfig.costPerKg) + 
             (distance * tariffConfig.costPerKm);
```

### 6. Validación de Cobertura
```typescript
const isCovered = await coverageService.validateZone(
  deliveryPostalCode,
  transportType
);
if (!isCovered) throw new UnsupportedDeliveryZoneError();
```

## ⚡ Optimizaciones

### Caché de Productos
- TTL: 10 minutos
- Clave: `product:{id}`
- Fallback a datos por defecto si Stock no responde

### Timeout y Circuit Breaker
- Timeout Stock API: 2 segundos
- Circuit breaker: 5 fallos → 30s de recuperación
- Flag `estimated: true` si se usan datos por defecto

### Respuesta Rápida
- Consultas paralelas a Stock API
- Caché de distancias frecuentes
- Cálculos optimizados

## 🔒 Validaciones

### Input Validation
- DTOs con class-validator
- Postal code formato argentino: `H3500ABC` (patrón: `^([A-Z]{1}\d{4}[A-Z]{3})$`)
- Products array no vacío
- Quantities > 0
- Validación de códigos postales en delivery_address
- Validación de códigos postales de depósitos desde Stock API

### Business Validation
- Zona de cobertura válida
- Productos existentes en Stock
- Método de transporte disponible
- Distancia calculable
- Códigos postales válidos (formato argentino CPA)
- Códigos postales de depósitos válidos desde Stock API

## 🚨 Manejo de Errores

### Errores de Stock API
```typescript
// Timeout o fallo → usar datos por defecto
const defaultProduct = {
  pesoKg: 1.0,
  dimensiones: { largoCm: 30, anchoCm: 20, altoCm: 15 },
  ubicacion: { postal_code: "H3500ABC" }
};
```

### Errores de Cobertura
```typescript
throw new UnsupportedDeliveryZoneError(
  `Zona ${postalCode} no cubierta por ${transportType}`
);
```

### Errores de Distancia
```typescript
throw new DistanceCalculationError(
  "No se pudo calcular distancia entre depósitos"
);
```

### Errores de Código Postal
```typescript
throw new InvalidPostalCodeError(
  `Código postal inválido: ${postalCode}. Formato esperado: H3500ABC`
);
```

## 📊 Métricas y Monitoreo

### Métricas de Performance
- Tiempo de respuesta promedio
- Hit rate del caché de productos
- Fallos de Stock API
- Uso de datos por defecto

### Logs Estructurados
```json
{
  "timestamp": "2025-01-18T10:00:00Z",
  "level": "info",
  "service": "shipping-quote",
  "action": "calculate_cost",
  "products_count": 3,
  "total_weight": 15.5,
  "distance_km": 450,
  "response_time_ms": 1200,
  "estimated": false,
  "cache_hits": 2
}
```

## 🧪 Testing

### Tests Unitarios
- Cálculo de peso volumétrico
- Aplicación de tarifas
- Validación de cobertura
- Manejo de errores

### Tests de Integración
- Endpoint completo con Stock API mock
- Caché de productos
- Timeout y circuit breaker
- Respuesta en < 3 segundos

### Tests de Performance
- Carga con múltiples productos
- Concurrent requests
- Memory usage

### Tests de Validación
- Códigos postales válidos (formato argentino CPA)
- Códigos postales inválidos
- Códigos postales de depósitos desde Stock API
- Validación de formato: `^([A-Z]{1}\d{4}[A-Z]{3})$`

## 🔄 Integración con Servicios Existentes

### Stock Integration Service
```typescript
// Usar servicio existente de RF-002
const product = await stockIntegration.getProductById(productId);
```

### Config Service
```typescript
// Usar métodos de transporte y tarifas de RF-001
const transportMethods = await configService.getTransportMethods();
const tariff = await configService.getTariffConfig(transportType);
```

### Coverage Zone Service
```typescript
// Usar validación de zonas de RF-001
const isCovered = await coverageService.validateZone(postalCode, transportType);
```

## 📈 Configuración

### Variables de Entorno
```env
# Nota: Factor volumétrico, tarifas base, costo/kg y costo/km 
# se obtienen de la BD (tabla tariff_configs, configurado en RF-001)

# Distance calculation
DISTANCE_API_URL=https://api.distance.com
DISTANCE_API_KEY=your-key

# Timeouts
STOCK_API_TIMEOUT=2000
QUOTE_TIMEOUT=3000

# Cache
PRODUCT_CACHE_TTL=600
DISTANCE_CACHE_TTL=3600
```

### Configuración de Tarifas (desde BD - RF-001)
- Base tariff por método de transporte (TariffConfig.baseTariff)
- Cost per kg (TariffConfig.costPerKg)
- Cost per km (TariffConfig.costPerKm)
- Volumetric factor (TariffConfig.volumetricFactor)
- Zonas de cobertura (CoverageZone.postalCodes)

## 🚀 Deployment

### Dependencias
- Stock Integration Service (RF-002)
- Config Service (RF-001)
- Redis para caché
- API de geocoding/distancia

### Health Checks
```typescript
GET /health
{
  "status": "healthy",
  "services": {
    "stock_integration": "healthy",
    "config_service": "healthy",
    "distance_api": "healthy",
    "cache": "healthy"
  }
}
```

## 📚 Documentación

### OpenAPI
- Endpoint documentado en `openapilog.yaml`
- Ejemplos de request/response
- Códigos de error

### README
- Guía de uso del endpoint
- Ejemplos de integración
- Troubleshooting

## 🔮 Próximos Pasos

1. **RF-004**: Esquema de BD completo
2. **RF-005**: Gestión de envíos
3. **RF-006**: Notificaciones
4. **RF-007**: Reportes y analytics

---

**Prioridad**: P0 (Crítico)  
**Complejidad**: Alta  
**Estimación**: 8 story points  
**Dependencias**: RF-001 (Config), RF-002 (Stock Integration)
