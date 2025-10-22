# 📡 RF-007: Servicios HTTP (API Client Layer)

## 📋 Información General

| Aspecto | Detalle |
|---------|---------|
| **RF** | RF-007 |
| **Nombre** | Servicios HTTP (API Client Layer) |
| **Prioridad** | P0 - CRÍTICO |
| **Complejidad** | Media |
| **Estimación** | 40 horas |
| **Team** | Middleware (3 personas) |
| **Estado** | Diseño |

---

## 🎯 Objetivo

Crear una capa de servicios HTTP que encapsule todas las llamadas al backend, proporcionando:
- ✅ Cliente HTTP base con configuración centralizada
- ✅ Inyección automática de JWT en headers
- ✅ Manejo unificado de errores HTTP
- ✅ Servicios específicos por dominio
- ✅ Retry logic para requests idempotentes
- ✅ Logging y debugging centralizado

---

## 📊 Arquitectura

### Capas de Integración

```
┌─────────────────────────────────────────────────┐
│          React Components                       │
│          (Dashboard, Config, etc)               │
└──────────────────────┬──────────────────────────┘
                       │ Consume
┌──────────────────────▼──────────────────────────┐
│       Domain Services (Layer)                   │
│  (ConfigService, ShipmentService, etc)          │
└──────────────────────┬──────────────────────────┘
                       │ Use
┌──────────────────────▼──────────────────────────┐
│       HTTP Client Base                          │
│  (Configuración, Interceptores, Retry)          │
└──────────────────────┬──────────────────────────┘
                       │ Makes
┌──────────────────────▼──────────────────────────┐
│       Backend Microservices                     │
│  (Operator Interface - 3004)                    │
│       + Internal Services                       │
│  (Config-3003, Shipping-3001, etc)              │
└─────────────────────────────────────────────────┘
```

### Configuración Base HTTP

```typescript
// Configuración Global
interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retryConfig: RetryConfig;
  errorHandling: ErrorHandlingConfig;
}

// Por defecto:
- baseURL: 'http://localhost:3004' (dev) o env variable
- timeout: 30000ms
- headers: Content-Type, Accept, User-Agent
- retry: 3 intentos para GET, 0 para otros
- errorHandling: mapeo centralizado de errores
```

---

## 🏗️ Componentes Principales

### 1. HTTP Client Base (`http-client.ts`)

**Responsabilidades:**
- Configurar axios o fetch wrapper
- Interceptores de request/response
- Inyección automática de JWT
- Transformación de datos

**Métodos Principales:**
```typescript
class HttpClient {
  // Core
  get<T>(url, config?)
  post<T>(data, url, config?)
  patch<T>(url, data, config?)
  delete<T>(url, config?)
  
  // Configuración
  setAuthToken(token: string)
  setBaseUrl(url: string)
  setTimeout(ms: number)
  
  // Interceptores
  addRequestInterceptor(handler)
  addResponseInterceptor(handler)
}
```

**Flujo de Request:**
```
Request Data
    ↓
RequestInterceptor (inyecta JWT)
    ↓
Retry Logic (3 intentos)
    ↓
HTTP Call
    ↓
ResponseInterceptor (mapea errores)
    ↓
Response/Error
```

---

### 2. Domain Services (7 servicios específicos)

#### A. **ConfigService** (transport methods, coverage zones)

```typescript
interface IConfigService {
  // Transport Methods
  getTransportMethods(): Promise<TransportMethod[]>
  getTransportMethod(id: string): Promise<TransportMethod>
  createTransportMethod(data: CreateTransportMethodDTO): Promise<TransportMethod>
  updateTransportMethod(id: string, data: UpdateTransportMethodDTO): Promise<TransportMethod>
  
  // Coverage Zones
  getCoverageZones(): Promise<CoverageZone[]>
  getCoverageZone(id: string): Promise<CoverageZone>
  createCoverageZone(data: CreateCoverageZoneDTO): Promise<CoverageZone>
  updateCoverageZone(id: string, data: UpdateCoverageZoneDTO): Promise<CoverageZone>
}
```

**Endpoints:**
- GET `/config/transport-methods`
- GET `/config/transport-methods/:id`
- POST `/config/transport-methods`
- PATCH `/config/transport-methods/:id`
- GET `/config/coverage-zones`
- GET `/config/coverage-zones/:id`
- POST `/config/coverage-zones`
- PATCH `/config/coverage-zones/:id`

---

#### B. **ShipmentService** (cotización y CRUD envíos)

```typescript
interface IShipmentService {
  // Shipments CRUD
  getShipments(filters?: ShipmentFilters): Promise<Shipment[]>
  getShipment(id: string): Promise<Shipment>
  createShipment(data: CreateShipmentDTO): Promise<Shipment>
  updateShipment(id: string, data: UpdateShipmentDTO): Promise<Shipment>
  deleteShipment(id: string): Promise<void>
  
  // Quotation
  calculateQuote(data: QuoteRequestDTO): Promise<QuoteResponseDTO>
  getQuoteHistory(shipmentId: string): Promise<Quote[]>
}
```

**Endpoints:**
- GET `/shipments`
- GET `/shipments/:id`
- POST `/shipments` (crear con cotización)
- PATCH `/shipments/:id`
- DELETE `/shipments/:id`
- POST `/shipments/quote/calculate`

---

#### C. **VehicleService** (CRUD vehículos)

```typescript
interface IVehicleService {
  getVehicles(filters?: VehicleFilters): Promise<Vehicle[]>
  getVehicle(id: string): Promise<Vehicle>
  createVehicle(data: CreateVehicleDTO): Promise<Vehicle>
  updateVehicle(id: string, data: UpdateVehicleDTO): Promise<Vehicle>
  deleteVehicle(id: string): Promise<void>
  getVehiclesByStatus(status: VehicleStatus): Promise<Vehicle[]>
}
```

**Endpoints:**
- GET `/vehicles`
- GET `/vehicles/:id`
- POST `/vehicles`
- PATCH `/vehicles/:id`
- DELETE `/vehicles/:id`

---

#### D. **DriverService** (CRUD conductores)

```typescript
interface IDriverService {
  getDrivers(filters?: DriverFilters): Promise<Driver[]>
  getDriver(id: string): Promise<Driver>
  createDriver(data: CreateDriverDTO): Promise<Driver>
  updateDriver(id: string, data: UpdateDriverDTO): Promise<Driver>
  deleteDriver(id: string): Promise<void>
  getDriversByStatus(status: DriverStatus): Promise<Driver[]>
}
```

**Endpoints:**
- GET `/drivers`
- GET `/drivers/:id`
- POST `/drivers`
- PATCH `/drivers/:id`
- DELETE `/drivers/:id`

---

#### E. **RouteService** (planificación de rutas)

```typescript
interface IRouteService {
  getRoutes(filters?: RouteFilters): Promise<Route[]>
  getRoute(id: string): Promise<Route>
  createRoute(data: CreateRouteDTO): Promise<Route>
  updateRoute(id: string, data: UpdateRouteDTO): Promise<Route>
  deleteRoute(id: string): Promise<void>
  getRouteStops(routeId: string): Promise<RouteStop[]>
  addRouteStop(routeId: string, data: CreateRouteStopDTO): Promise<RouteStop>
}
```

**Endpoints:**
- GET `/routes`
- GET `/routes/:id`
- POST `/routes`
- PATCH `/routes/:id`
- DELETE `/routes/:id`
- GET `/routes/:id/stops`
- POST `/routes/:id/stops`

---

#### F. **ReportService** (KPIs y analytics)

```typescript
interface IReportService {
  getDashboardMetrics(period?: DateRange): Promise<DashboardMetrics>
  getShipmentMetrics(period?: DateRange): Promise<ShipmentMetrics>
  getVehicleUtilization(period?: DateRange): Promise<VehicleUtilization[]>
  getDriverPerformance(driverId?: string): Promise<DriverPerformance[]>
  getRouteEfficiency(period?: DateRange): Promise<RouteEfficiency[]>
  exportReport(type: ReportType, format: ExportFormat): Promise<Blob>
}
```

**Endpoints:**
- GET `/reports/dashboard`
- GET `/reports/shipments`
- GET `/reports/vehicles/utilization`
- GET `/reports/drivers/performance`
- GET `/reports/routes/efficiency`
- POST `/reports/export`

---

#### G. **HealthService** (health checks)

```typescript
interface IHealthService {
  checkHealth(): Promise<HealthStatus>
  getServiceStatus(service: string): Promise<ServiceStatus>
  getPingLatency(): Promise<number>
}
```

**Endpoints:**
- GET `/health`
- GET `/health/services/:name`

---

### 3. Error Handling (`error-handler.ts`)

**Mapeo de Errores HTTP → Dominio:**

```typescript
class ApiError extends Error {
  constructor(
    public code: string,           // 'NETWORK_ERROR', 'AUTH_FAILED', etc
    public statusCode: number,
    public message: string,
    public details?: Record<string, any>
  ) {}
}

// Mapeo automático
400 Bad Request → ValidationError
401 Unauthorized → AuthenticationError
403 Forbidden → AuthorizationError
404 Not Found → NotFoundError
409 Conflict → ConflictError
429 Too Many Requests → RateLimitError
500 Internal Server Error → ServerError
Network Error → NetworkError
Timeout → TimeoutError
```

**Uso en Components:**
```typescript
try {
  await configService.updateTransportMethod(id, data)
} catch (error) {
  if (error instanceof ValidationError) {
    // Mostrar errores de validación
  } else if (error instanceof NetworkError) {
    // Mostrar desconexión
  }
}
```

---

### 4. Retry Logic (`retry-strategy.ts`)

**Estrategia de Reintentos:**

```typescript
interface RetryConfig {
  maxRetries: number;        // 3
  initialDelay: number;      // 100ms
  maxDelay: number;          // 10000ms
  backoffMultiplier: number; // 2
  retryableStatusCodes: number[]; // [408, 429, 500, 502, 503, 504]
}

// Exponential Backoff
Attempt 1: 100ms delay
Attempt 2: 200ms delay
Attempt 3: 400ms delay
```

**Aplicado a:**
- GET requests: Sí (idempotentes)
- POST requests: No (creación)
- PATCH requests: No (mutación)
- DELETE requests: No (mutación)

---

### 5. Request Interceptor (`interceptors/request.ts`)

**Responsabilidades:**
- ✅ Inyectar JWT automáticamente
- ✅ Agregar headers comunes (User-Agent, Accept-Language)
- ✅ Logging de requests
- ✅ Transformación de datos

```typescript
const requestInterceptor = (config) => {
  // 1. JWT del store
  const token = authStore.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // 2. Headers comunes
  config.headers['X-Requested-With'] = 'XMLHttpRequest'
  config.headers['Accept-Language'] = 'es-AR'
  
  // 3. Logging
  console.log(`[HTTP] ${config.method.toUpperCase()} ${config.url}`)
  
  return config
}
```

---

### 6. Response Interceptor (`interceptors/response.ts`)

**Responsabilidades:**
- ✅ Mapear errores HTTP
- ✅ Detectar expiración de JWT
- ✅ Logging de responses
- ✅ Transformación de datos

```typescript
const responseInterceptor = {
  onSuccess: (response) => {
    console.log(`[HTTP] ✅ ${response.status}`)
    return response
  },
  
  onError: (error) => {
    if (error.response?.status === 401) {
      // Token expirado → logout automático
      authStore.logout()
    }
    throw transformError(error)
  }
}
```

---

### 7. Logging (`utils/logger.ts`)

**Niveles de Log:**
```typescript
logger.info(`Fetching transport methods...`)
logger.debug(`Request URL: ${url}`)
logger.warn(`Retry attempt 2 of 3`)
logger.error(`Failed to create shipment`, error)
```

**Información Capturada:**
- Timestamp
- Método HTTP
- URL
- Status Code
- Tiempo de respuesta
- Tamaño de payload
- Headers (sin sensibles)

---

## 📝 Estructura de Carpetas

```
frontend/src/lib/middleware/
├── http/
│   ├── http-client.ts              # Cliente base
│   ├── http-client.spec.ts         # Tests
│   └── config.ts                   # Configuración
├── services/
│   ├── config.service.ts
│   ├── shipment.service.ts
│   ├── vehicle.service.ts
│   ├── driver.service.ts
│   ├── route.service.ts
│   ├── report.service.ts
│   ├── health.service.ts
│   └── index.ts                    # Exports
├── errors/
│   ├── api-error.ts                # Clase base
│   ├── error-handler.ts            # Mapeo de errores
│   └── error-types.ts              # Tipos específicos
├── interceptors/
│   ├── request.ts
│   ├── response.ts
│   └── retry.ts
├── utils/
│   ├── logger.ts
│   ├── http.utils.ts
│   └── index.ts
└── types/
    └── http-types.ts               # Tipos TS
```

---

## 🔄 Flujo de Ejecución

### Crear un Envío (Ejemplo)

```
User clicks "Create Shipment"
      ↓
Component → ShipmentService.createShipment()
      ↓
RequestInterceptor ← inyecta JWT
      ↓
POST /shipments (con retry logic)
      ↓
ResponseInterceptor → mapea errores
      ↓
Success? → Actualiza store
Failure? → Lanza ApiError específico
      ↓
Component catch error → Muestra toast
```

---

## 🧪 Testing Strategy

### Unit Tests
- ✅ Cada service por separado
- ✅ Mocks de http-client
- ✅ Validación de params

### Integration Tests
- ✅ http-client + interceptors
- ✅ Retry logic
- ✅ Error mapping

### E2E Tests
- ✅ Componente → Service → API
- ✅ States reales (token, errores)

---

## 📊 Criterios de Aceptación

| # | Criterio | Status |
|---|----------|--------|
| 1 | HttpClient configurado con baseURL, timeout, headers | ⏳ |
| 2 | JWT inyectado automáticamente en todos los requests | ⏳ |
| 3 | ConfigService completo (CRUD métodos y zonas) | ⏳ |
| 4 | ShipmentService completo (CRUD envíos y cotizaciones) | ⏳ |
| 5 | VehicleService completamente funcional | ⏳ |
| 6 | DriverService completamente funcional | ⏳ |
| 7 | RouteService completamente funcional | ⏳ |
| 8 | ReportService para KPIs y analytics | ⏳ |
| 9 | Errores mapeados correctamente (400, 401, 403, 404, 409, etc) | ⏳ |
| 10 | Retry logic: 3 intentos exponenciales para GET | ⏳ |
| 11 | Logging centralizado de requests/responses | ⏳ |
| 12 | 100% de cobertura de tests en servicios | ⏳ |
| 13 | TypeScript con tipado fuerte en todos los métodos | ⏳ |
| 14 | Documentación de cada servicio | ⏳ |
| 15 | Integración con stores de autenticación | ⏳ |

---

## 🔗 Dependencias

### Externa
- **axios** o **fetch api**: Para HTTP requests
- **TypeScript**: Tipado fuerte

### Interna
- `authStore`: Para obtener token JWT
- **Validators**: Para validar datos (RF-008)
- **Mappers**: Para transformar datos (RF-008)

---

## 📈 Métricas de Éxito

| Métrica | Target |
|---------|--------|
| Latencia promedio de request | < 500ms |
| Tasa de reintento exitoso | > 90% |
| Cobertura de tests | > 95% |
| Performance (bundle size) | < 50KB gzipped |
| Documentación completitud | 100% |

---

## 🚀 Integración con Backend

**Expectativas del Backend:**
- ✅ Endpoints en `/config/`, `/shipments/`, `/vehicles/`, `/drivers/`, `/routes/`, `/reports/`
- ✅ Respuestas en JSON con tipado
- ✅ Errores con código HTTP y mensaje descriptivo
- ✅ CORS habilitado para desarrollo
- ✅ JWT en header `Authorization: Bearer {token}`

**Verificación:**
```bash
# Health check
curl http://localhost:3004/health

# Test transport methods
curl http://localhost:3004/config/transport-methods

# Con auth
curl -H "Authorization: Bearer {token}" \
  http://localhost:3004/shipments
```

---

## 📚 Referencias

- Backend Endpoints: `API-ENDPOINTS-INTERNOS.md`
- Arquitectura Microservicios: Backend README
- RF-008: State Management (stores)
- RF-009: Validators y Mappers
