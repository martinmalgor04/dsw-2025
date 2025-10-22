# 🌍 API de Geolocalización - Configuración y Uso

## 📋 Visión General

El servicio de cotización (RF-003) requiere calcular distancias entre códigos postales argentinos para determinar costos de envío. Hay varias opciones de APIs de geolocalización disponibles.

## 🎯 Opciones de API

### **Opción 1: Distance Matrix AI** (Recomendada para Desarrollo)

**Ventajas:**
- ✅ Plan gratuito: 25,000 requests/mes
- ✅ Soporte para códigos postales argentinos
- ✅ Respuesta rápida
- ✅ No requiere tarjeta de crédito para tier gratuito

**URL**: https://distancematrix.ai/

#### Setup:

1. **Registrarse**: 
   - Ir a https://distancematrix.ai/
   - Crear cuenta gratuita
   - Obtener API Key

2. **Configurar en `.env`**:
```env
DISTANCE_API_URL=https://api.distancematrix.ai/maps/api/distancematrix/json
DISTANCE_API_KEY=your-api-key-here
```

3. **Ejemplo de Request**:
```bash
curl "https://api.distancematrix.ai/maps/api/distancematrix/json?origins=H3500ABC&destinations=C1000AAA&key=YOUR_API_KEY"
```

4. **Respuesta Esperada**:
```json
{
  "destination_addresses": ["Buenos Aires, Argentina"],
  "origin_addresses": ["Resistencia, Chaco, Argentina"],
  "rows": [
    {
      "elements": [
        {
          "distance": {
            "text": "1,000 km",
            "value": 1000000
          },
          "duration": {
            "text": "12 hours",
            "value": 43200
          },
          "status": "OK"
        }
      ]
    }
  ],
  "status": "OK"
}
```

---

### **Opción 2: Google Maps Distance Matrix API**

**Ventajas:**
- ✅ Datos muy precisos
- ✅ Cobertura global excelente
- ✅ Documentación completa

**Desventajas:**
- ⚠️ Requiere tarjeta de crédito
- ⚠️ Costo después de $200 USD de crédito gratuito/mes

#### Setup:

1. **Habilitar API**:
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear proyecto
   - Habilitar "Distance Matrix API"
   - Crear credenciales (API Key)

2. **Configurar en `.env`**:
```env
DISTANCE_API_URL=https://maps.googleapis.com/maps/api/distancematrix/json
DISTANCE_API_KEY=your-google-api-key
```

3. **Ejemplo de Request**:
```bash
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=H3500ABC&destinations=C1000AAA&key=YOUR_API_KEY"
```

---

### **Opción 3: OpenRouteService** (Gratuita Open Source)

**Ventajas:**
- ✅ Completamente gratuita
- ✅ Open source
- ✅ Sin límites estrictos

**Desventajas:**
- ⚠️ Menos precisa en Argentina
- ⚠️ Puede ser más lenta

#### Setup:

1. **Registrarse**:
   - Ir a https://openrouteservice.org/
   - Crear cuenta gratuita
   - Obtener API Key

2. **Configurar en `.env`**:
```env
DISTANCE_API_URL=https://api.openrouteservice.org/v2/matrix/driving-car
DISTANCE_API_KEY=your-ors-api-key
```

---

### **Opción 4: Cálculo Manual con Geolib** (Sin API Externa)

**Ventajas:**
- ✅ Sin límites de requests
- ✅ Sin costos
- ✅ Funciona offline

**Desventajas:**
- ⚠️ Cálculo de distancia en línea recta (no considera rutas reales)
- ⚠️ Menos preciso

#### Setup:

Ya incluido en el proyecto con la librería `geolib`.

**Configurar en `.env`**:
```env
# Dejar vacío para usar cálculo manual
DISTANCE_API_URL=
DISTANCE_API_KEY=
```

**Uso**:
```typescript
import { getDistance } from 'geolib';

// Coordenadas de códigos postales argentinos
const distance = getDistance(
  { latitude: -27.4516, longitude: -58.9867 }, // Resistencia
  { latitude: -34.6037, longitude: -58.3816 }  // Buenos Aires
);

console.log(`Distancia: ${distance / 1000} km`);
```

---

## ⚙️ Configuración del Proyecto

### Variables de Entorno

Agregar en `backend/.env`:

```env
# Distance Calculation API
DISTANCE_API_URL=https://api.distancematrix.ai/maps/api/distancematrix/json
DISTANCE_API_KEY=your-api-key-here

# Cache para distancias (reduce llamadas a la API)
DISTANCE_CACHE_TTL=3600  # 1 hora
```

### Implementación en el Código

El servicio `DistanceCalculationService` usa esta configuración:

```typescript
// backend/src/modules/shipping-quote/services/distance-calculation.service.ts

@Injectable()
export class DistanceCalculationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: QuoteCacheService,
  ) {}

  async calculateDistance(
    fromPostalCode: string,
    toPostalCode: string,
  ): Promise<number> {
    // 1. Intentar obtener desde caché
    const cached = await this.cacheService.getDistance(fromPostalCode, toPostalCode);
    if (cached) return cached;

    // 2. Si hay API configurada, usarla
    if (this.configService.get('DISTANCE_API_URL')) {
      const distance = await this.fetchFromAPI(fromPostalCode, toPostalCode);
      await this.cacheService.setDistance(fromPostalCode, toPostalCode, distance);
      return distance;
    }

    // 3. Fallback: cálculo manual con geolib
    return this.calculateManually(fromPostalCode, toPostalCode);
  }
}
```

---

## 🧪 Testing de la API

### Test Manual con cURL

```bash
# Distance Matrix AI
curl "https://api.distancematrix.ai/maps/api/distancematrix/json?origins=H3500ABC&destinations=C1000AAA&key=YOUR_API_KEY"

# Google Maps
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=H3500ABC&destinations=C1000AAA&key=YOUR_API_KEY"
```

### Test desde el Backend

```bash
# Endpoint de cotización (usa internamente la API de distancias)
curl -X POST http://localhost:3000/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_address": {
      "street": "Av. 9 de Julio 1000",
      "city": "Buenos Aires",
      "state": "CABA",
      "postal_code": "C1000AAA",
      "country": "AR"
    },
    "products": [
      {"id": 1, "quantity": 2}
    ]
  }'
```

---

## 📊 Monitoreo y Debugging

### Ver Logs de Distancias

El servicio logea automáticamente:

```typescript
// Logs estructurados
{
  "level": "debug",
  "service": "DistanceCalculationService",
  "action": "calculate_distance",
  "from": "H3500ABC",
  "to": "C1000AAA",
  "distance_km": 1000,
  "cached": false,
  "api_used": "distancematrix.ai"
}
```

### Verificar Caché de Distancias

```bash
# Conectar a Redis
redis-cli

# Ver distancias cacheadas
127.0.0.1:6379> KEYS quote:distance:*

# Ver valor específico
127.0.0.1:6379> GET quote:distance:H3500ABC:C1000AAA
```

### Verificar Uso de API

Monitorear requests a la API externa:

```bash
# Logs del backend mostrarán:
[DistanceCalculationService] API Request to distancematrix.ai
[DistanceCalculationService] Response: 1000 km in 250ms
```

---

## 🚨 Troubleshooting

### Error: API Key Inválida

**Error**: `401 Unauthorized` o `403 Forbidden`

**Solución**:
```bash
# 1. Verificar que la API key esté correcta en .env
cat backend/.env | grep DISTANCE_API_KEY

# 2. Regenerar API key en el panel de la API

# 3. Test directo con cURL
curl "https://api.distancematrix.ai/maps/api/distancematrix/json?origins=test&destinations=test&key=YOUR_KEY"
```

### Error: Límite de Requests Excedido

**Error**: `429 Too Many Requests`

**Soluciones**:
1. **Aumentar TTL del caché**:
```env
DISTANCE_CACHE_TTL=7200  # 2 horas en lugar de 1
```

2. **Upgrade a plan pagado** de la API

3. **Usar cálculo manual** como fallback

### Error: Código Postal No Encontrado

**Error**: `ZERO_RESULTS` en la respuesta de la API

**Soluciones**:
```typescript
// Implementar geocoding manual para códigos postales argentinos
const postalCodeCoordinates = {
  'H3500ABC': { lat: -27.4516, lon: -58.9867 }, // Resistencia
  'C1000AAA': { lat: -34.6037, lon: -58.3816 }, // Buenos Aires
  // ... más códigos postales
};
```

### Performance Lenta

**Síntomas**: Requests de cotización tardan > 3 segundos

**Soluciones**:
1. **Verificar hit rate del caché**:
```bash
redis-cli INFO stats | grep keyspace
```

2. **Pre-cachear distancias comunes**:
```typescript
// Script de pre-carga
const commonRoutes = [
  ['H3500ABC', 'C1000AAA'],
  ['H3500ABC', 'X5000ABC'],
  // ... rutas frecuentes
];

for (const [from, to] of commonRoutes) {
  await distanceService.calculateDistance(from, to);
}
```

3. **Usar múltiples APIs** con fallback:
```typescript
try {
  return await this.distanceMatrixAI(from, to);
} catch {
  return await this.googleMaps(from, to);
}
```

---

## 💰 Costos Estimados

### Distance Matrix AI (Recomendada)
- **Gratuito**: 25,000 requests/mes
- **Costo adicional**: $5 USD por 10,000 requests adicionales

### Google Maps Distance Matrix API
- **Crédito gratuito**: $200 USD/mes
- **Costo**: $5 USD por 1,000 requests (después del crédito)

### OpenRouteService
- **Gratuito**: Ilimitado (rate limit: 40 requests/minuto)

### Geolib (Manual)
- **Gratuito**: Ilimitado, sin costo

---

## 🎯 Recomendaciones

### Para Desarrollo
✅ **Distance Matrix AI** (plan gratuito) + **Geolib** (fallback)

### Para Producción
✅ **Google Maps** (precisión) + **Redis** (caché agresivo) + **Geolib** (fallback)

### Para Proyecto Universitario
✅ **Distance Matrix AI** (suficiente para demo) + **Geolib** (sin costo)

---

## 📚 Recursos Adicionales

- [Distance Matrix AI Docs](https://distancematrix.ai/dev)
- [Google Maps Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)
- [OpenRouteService API](https://openrouteservice.org/dev/#/api-docs)
- [Geolib GitHub](https://github.com/manuelbieh/geolib)

---

## 🎯 Checklist de Setup

- [ ] API de distancias elegida
- [ ] API Key obtenida
- [ ] Variables configuradas en `.env`
- [ ] Test manual con cURL exitoso
- [ ] Caché de Redis configurado
- [ ] Fallback a Geolib implementado
- [ ] Logs de distancias funcionando
- [ ] Test de cotización completo exitoso

---

**Última actualización**: 2025-10-18  
**API Recomendada**: Distance Matrix AI (free tier)  
**Mantenido por**: Grupo 12 - UTN FRRE

