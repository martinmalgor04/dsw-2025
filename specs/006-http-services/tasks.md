# 📝 Tasks - RF-007: Servicios HTTP

## 📋 Task Board

Total: **32 tasks** | Duración: **40 horas**

---

## FASE 1: Configuración Base & HTTP Client (8 horas)

### TASK-001: Setup TypeScript y Configuración Base
- **ID**: TASK-001
- **Título**: Configurar TypeScript, ESLint y estructura base
- **Estimación**: 1 hora
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: -
- **Descripción**:
  Configurar el entorno TypeScript para el middleware con ESLint, Prettier y paths alias.
- **Checklist**:
  - [ ] `tsconfig.json` actualizado para strict mode
  - [ ] ESLint configurado con reglas Airbnb
  - [ ] Prettier configurado (.prettierrc)
  - [ ] Paths alias `@/*` funcionales
  - [ ] Estructura de carpetas creada
  - [ ] `.env.example` para variables
- **Aceptación**:
  - `npm run lint` sin errores
  - `npm run format` funciona correctamente
  - Imports pueden usar `@/` prefix

---

### TASK-002: Implementar HTTP Client Base
- **ID**: TASK-002
- **Título**: Crear clase HttpClient con métodos core
- **Estimación**: 3 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-001
- **Descripción**:
  Implementar clase `HttpClient` que encapsule axios con configuración centralizada.
- **Archivos**:
  - `frontend/src/lib/middleware/http/http-client.ts`
  - `frontend/src/lib/middleware/http/config.ts`
  - `frontend/src/lib/middleware/http/http-client.spec.ts`
- **Métodos a Implementar**:
  ```typescript
  get<T>(url: string, config?: AxiosConfig): Promise<T>
  post<T>(url: string, data: any, config?: AxiosConfig): Promise<T>
  patch<T>(url: string, data: any, config?: AxiosConfig): Promise<T>
  delete<T>(url: string, config?: AxiosConfig): Promise<T>
  setAuthToken(token: string): void
  setBaseUrl(url: string): void
  setTimeout(ms: number): void
  addRequestInterceptor(handler): void
  addResponseInterceptor(handler): void
  ```
- **Tests**:
  - [ ] GET request retorna datos correctos
  - [ ] POST request envía y recibe datos
  - [ ] PATCH request actualiza correctamente
  - [ ] DELETE request se ejecuta
  - [ ] Configuración se aplica globalmente
  - [ ] Métodos lanzan errores apropiados
- **Aceptación**:
  - Coverage >95%
  - Todos los métodos tipados con TypeScript
  - Documentación JSDoc completa

---

### TASK-003: Implementar Error Handling
- **ID**: TASK-003
- **Título**: Crear sistema de mapeo de errores HTTP
- **Estimación**: 2 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 2
- **Dependencias**: TASK-002
- **Descripción**:
  Implementar mapeo automático de códigos HTTP a tipos de error específicos.
- **Archivos**:
  - `frontend/src/lib/middleware/errors/api-error.ts`
  - `frontend/src/lib/middleware/errors/error-types.ts`
  - `frontend/src/lib/middleware/errors/error-handler.ts`
  - `frontend/src/lib/middleware/errors/error-handler.spec.ts`
- **Tipos de Error a Soportar**:
  - `ValidationError` (400)
  - `AuthenticationError` (401)
  - `AuthorizationError` (403)
  - `NotFoundError` (404)
  - `ConflictError` (409)
  - `RateLimitError` (429)
  - `ServerError` (500+)
  - `NetworkError` (sin conexión)
  - `TimeoutError` (timeout)
- **Tests**:
  - [ ] 400 → ValidationError
  - [ ] 401 → AuthenticationError
  - [ ] 404 → NotFoundError
  - [ ] Errores de red → NetworkError
  - [ ] Detalles de error capturados correctamente
- **Aceptación**:
  - Mapeo 100% de códigos HTTP comunes
  - Mensajes de error descriptivos
  - Coverage >95%

---

### TASK-004: Implementar Retry Logic
- **ID**: TASK-004
- **Título**: Crear estrategia de reintentos exponencial
- **Estimación**: 2 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 3
- **Dependencias**: TASK-002
- **Descripción**:
  Implementar retry logic con exponential backoff para GET requests.
- **Archivos**:
  - `frontend/src/lib/middleware/interceptors/retry.ts`
  - `frontend/src/lib/middleware/interceptors/retry.spec.ts`
- **Especificaciones**:
  - Máximo 3 intentos
  - Delay inicial: 100ms
  - Multiplicador: 2x
  - Solo para GET requests
  - Códigos retryables: 408, 429, 500, 502, 503, 504
- **Tests**:
  - [ ] Reintenta en 500
  - [ ] No reintenta POST
  - [ ] Exponential backoff correcto
  - [ ] Se rinde después de 3 intentos
  - [ ] Éxito en 2do intento funciona
- **Aceptación**:
  - Coverage >95%
  - Delay timing correcto
  - Logs de reintento

---

## FASE 2: Interceptores & Logging (6 horas)

### TASK-005: Implementar Request Interceptor
- **ID**: TASK-005
- **Título**: Crear interceptor de request con JWT
- **Estimación**: 2 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 2
- **Dependencias**: TASK-002
- **Descripción**:
  Implementar interceptor que inyecte JWT y headers comunes.
- **Archivos**:
  - `frontend/src/lib/middleware/interceptors/request.ts`
  - `frontend/src/lib/middleware/interceptors/request.spec.ts`
- **Funcionalidades**:
  - Obtener token de authStore
  - Inyectar en `Authorization: Bearer {token}`
  - Agregar headers comunes
  - Logging de request
- **Headers a Agregar**:
  - `X-Requested-With: XMLHttpRequest`
  - `Accept-Language: es-AR`
  - `User-Agent: LogiX-Frontend/1.0`
- **Tests**:
  - [ ] JWT se inyecta correctamente
  - [ ] Headers comunes presentes
  - [ ] Request se loguea
  - [ ] Sin token → no inyecta Bearer
- **Aceptación**:
  - Coverage >95%
  - JWT inyectado en todos los requests

---

### TASK-006: Implementar Response Interceptor
- **ID**: TASK-006
- **Título**: Crear interceptor de response y manejo de errores
- **Estimación**: 2 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 3
- **Dependencias**: TASK-002, TASK-003
- **Descripción**:
  Interceptor que mapea errores y detecta expiración de JWT.
- **Archivos**:
  - `frontend/src/lib/middleware/interceptors/response.ts`
  - `frontend/src/lib/middleware/interceptors/response.spec.ts`
- **Funcionalidades**:
  - Mapear errores con error-handler
  - Detectar 401 → llamar authStore.logout()
  - Logging de response
  - Transformación de datos
- **Tests**:
  - [ ] 401 dispara logout
  - [ ] Errores se mapean
  - [ ] Response se loguea
  - [ ] Success responses pasan OK
- **Aceptación**:
  - Logout automático en 401
  - Error mapping correcto
  - Coverage >95%

---

### TASK-007: Implementar Logger Centralizado
- **ID**: TASK-007
- **Título**: Crear sistema de logging con niveles
- **Estimación**: 2 horas
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-002
- **Descripción**:
  Logger centralizado con niveles (info, debug, warn, error).
- **Archivos**:
  - `frontend/src/lib/middleware/utils/logger.ts`
  - `frontend/src/lib/middleware/utils/logger.spec.ts`
- **Métodos**:
  ```typescript
  logger.info(message, data?)
  logger.debug(message, data?)
  logger.warn(message, data?)
  logger.error(message, error?)
  logger.group(label, fn)
  ```
- **Información Capturada**:
  - Timestamp
  - Nivel de log
  - Mensaje
  - Contexto (URL, método, etc)
  - Stack trace (para errores)
- **Tests**:
  - [ ] Todos los niveles funcionan
  - [ ] Metadata capturada
  - [ ] Formato correcto
  - [ ] Dev vs Prod mode
- **Aceptación**:
  - Coverage >95%
  - Logs informativos pero no spam
  - Deshabilitables en prod

---

## FASE 3: Config Service (6 horas)

### TASK-008: Crear DTOs para Config
- **ID**: TASK-008
- **Título**: Definir DTOs de Transport Methods y Coverage Zones
- **Estimación**: 1 hora
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-001
- **Descripción**:
  Crear tipos y DTOs para servicios de configuración.
- **Archivos**:
  - `frontend/src/lib/middleware/types/config.types.ts`
  - `frontend/src/lib/middleware/services/dtos/config.dto.ts`
- **Tipos a Definir**:
  - `TransportMethod`
  - `CreateTransportMethodDTO`
  - `UpdateTransportMethodDTO`
  - `CoverageZone`
  - `CreateCoverageZoneDTO`
  - `UpdateCoverageZoneDTO`
- **Aceptación**:
  - Tipos exportados correctamente
  - JSDoc documentado
  - TypeScript strict mode OK

---

### TASK-009: Implementar ConfigService
- **ID**: TASK-009
- **Título**: Crear servicio completo de configuraciones
- **Estimación**: 3 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 2
- **Dependencias**: TASK-002, TASK-008
- **Descripción**:
  Implementar servicio con métodos de transporte y zonas.
- **Archivos**:
  - `frontend/src/lib/middleware/services/config.service.ts`
  - `frontend/src/lib/middleware/services/config.service.spec.ts`
- **Métodos (Transport Methods)**:
  ```typescript
  getTransportMethods(): Promise<TransportMethod[]>
  getTransportMethod(id: string): Promise<TransportMethod>
  createTransportMethod(dto): Promise<TransportMethod>
  updateTransportMethod(id, dto): Promise<TransportMethod>
  ```
- **Métodos (Coverage Zones)**:
  ```typescript
  getCoverageZones(): Promise<CoverageZone[]>
  getCoverageZone(id: string): Promise<CoverageZone>
  createCoverageZone(dto): Promise<CoverageZone>
  updateCoverageZone(id, dto): Promise<CoverageZone>
  ```
- **Tests**:
  - [ ] GET /config/transport-methods retorna array
  - [ ] POST crea nuevo método
  - [ ] PATCH actualiza existente
  - [ ] GET /config/coverage-zones funciona
  - [ ] Errores se lanzan correctamente
- **Aceptación**:
  - Coverage >95%
  - Integración con backend OK
  - Tipado completo

---

### TASK-010: Integración Config Service con Backend
- **ID**: TASK-010
- **Título**: Probar ConfigService contra endpoints reales
- **Estimación**: 2 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-009
- **Descripción**:
  Tests de integración contra Operator Interface (3004).
- **Pasos**:
  1. Backend running en puerto 3004
  2. GET /config/transport-methods → ✅
  3. POST /config/transport-methods → ✅
  4. PATCH /config/transport-methods/:id → ✅
  5. GET /config/coverage-zones → ✅
  6. Errors mapeados correctamente
- **Tests E2E**:
  - [ ] Request real a backend
  - [ ] Response parsing OK
  - [ ] Error handling funciona
- **Aceptación**:
  - Todos los endpoints funcionan
  - Datos se persisten en BD
  - Error handling robusto

---

## FASE 4: Shipment Service (8 horas)

### TASK-011: Crear DTOs para Shipments
- **ID**: TASK-011
- **Título**: Definir DTOs y tipos para envíos
- **Estimación**: 1 hora
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-001
- **Descripción**:
  Crear tipos completos para Shipment y Quote.
- **Tipos**:
  - `Shipment`
  - `ShipmentStatus`
  - `CreateShipmentDTO`
  - `UpdateShipmentDTO`
  - `QuoteRequestDTO`
  - `QuoteResponseDTO`
  - `Quote`
- **Aceptación**:
  - Tipos exportados
  - JSDoc completo
  - TS strict OK

---

### TASK-012: Implementar ShipmentService CRUD
- **ID**: TASK-012
- **Título**: CRUD completo de envíos
- **Estimación**: 3 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 2
- **Dependencias**: TASK-002, TASK-011
- **Descripción**:
  Implementar métodos CRUD para Shipments.
- **Métodos**:
  ```typescript
  getShipments(filters?: ShipmentFilters): Promise<Shipment[]>
  getShipment(id: string): Promise<Shipment>
  createShipment(dto: CreateShipmentDTO): Promise<Shipment>
  updateShipment(id: string, dto: UpdateShipmentDTO): Promise<Shipment>
  deleteShipment(id: string): Promise<void>
  ```
- **Filtros Soportados**:
  - status, startDate, endDate
  - originZone, destinationZone
  - transportMethod
- **Tests**:
  - [ ] GET retorna lista filtrada
  - [ ] POST crea envío
  - [ ] PATCH actualiza estado
  - [ ] DELETE elimina
- **Aceptación**:
  - Coverage >95%
  - Filtros funcionales
  - Tipado completo

---

### TASK-013: Implementar Quote Calculation
- **ID**: TASK-013
- **Título**: Cálculo de cotizaciones
- **Estimación**: 3 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 3
- **Dependencias**: TASK-002, TASK-012
- **Descripción**:
  Implementar cálculo de cotizaciones y historial.
- **Métodos**:
  ```typescript
  calculateQuote(request: QuoteRequestDTO): Promise<QuoteResponseDTO>
  getQuoteHistory(shipmentId: string): Promise<Quote[]>
  ```
- **Request**:
  ```json
  {
    "weight": 100,
    "dimensions": { "width": 50, "height": 50, "depth": 50 },
    "transportMethod": "road",
    "originZone": "C1000",
    "destinationZone": "X5000"
  }
  ```
- **Response**:
  ```json
  {
    "baseCost": 500,
    "taxes": 105,
    "total": 605,
    "estimatedDays": "3-5"
  }
  ```
- **Tests**:
  - [ ] Calcula costo base
  - [ ] Aplica impuestos
  - [ ] Historial se persiste
  - [ ] Errores manejo
- **Aceptación**:
  - Cálculo correcto
  - Historial funcional
  - Coverage >95%

---

### TASK-014: Integración ShipmentService con Backend
- **ID**: TASK-014
- **Título**: Probar Shipment Service contra backend
- **Estimación**: 1 hora
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-012, TASK-013
- **Descripción**:
  E2E testing contra endpoints reales.
- **Tests**:
  - [ ] GET /shipments
  - [ ] POST /shipments
  - [ ] PATCH /shipments/:id
  - [ ] POST /shipments/quote/calculate
- **Aceptación**:
  - Todos endpoints OK
  - Datos persisten
  - Error handling OK

---

## FASE 5: Vehicle, Driver & Route Services (8 horas)

### TASK-015: Crear DTOs Vehicle, Driver, Route
- **ID**: TASK-015
- **Título**: Definir DTOs para vehículos, conductores y rutas
- **Estimación**: 1 hora
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-001
- **Descripción**:
  Crear tipos para Vehicle, Driver, Route, RouteStop.
- **Aceptación**:
  - Todos tipos exportados
  - JSDoc completo

---

### TASK-016: Implementar VehicleService
- **ID**: TASK-016
- **Título**: CRUD completo de vehículos
- **Estimación**: 2 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 2
- **Dependencias**: TASK-002, TASK-015
- **Descripción**:
  Servicio completo de vehículos.
- **Métodos**:
  ```typescript
  getVehicles(filters?: VehicleFilters)
  getVehicle(id)
  createVehicle(dto)
  updateVehicle(id, dto)
  deleteVehicle(id)
  getVehiclesByStatus(status)
  ```
- **Tests**: CRUD + Filtros
- **Aceptación**:
  - Coverage >95%
  - Integración backend OK

---

### TASK-017: Implementar DriverService
- **ID**: TASK-017
- **Título**: CRUD completo de conductores
- **Estimación**: 2 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 3
- **Dependencias**: TASK-002, TASK-015
- **Descripción**:
  Servicio completo de conductores.
- **Métodos**:
  ```typescript
  getDrivers(filters?)
  getDriver(id)
  createDriver(dto)
  updateDriver(id, dto)
  deleteDriver(id)
  getDriversByStatus(status)
  ```
- **Tests**: CRUD + Filtros
- **Aceptación**:
  - Coverage >95%
  - Integración backend OK

---

### TASK-018: Implementar RouteService
- **ID**: TASK-018
- **Título**: CRUD de rutas y paradas
- **Estimación**: 3 horas
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-002, TASK-015
- **Descripción**:
  Servicio con rutas y paradas.
- **Métodos**:
  ```typescript
  getRoutes(filters?)
  getRoute(id)
  createRoute(dto)
  updateRoute(id, dto)
  deleteRoute(id)
  getRouteStops(routeId)
  addRouteStop(routeId, dto)
  ```
- **Tests**: CRUD + RouteStops
- **Aceptación**:
  - Coverage >95%
  - Integración backend OK

---

## FASE 6: Report & Health Services (2 horas)

### TASK-019: Implementar ReportService
- **ID**: TASK-019
- **Título**: Servicio de reportes y KPIs
- **Estimación**: 1 hora
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 2
- **Dependencias**: TASK-002
- **Descripción**:
  Servicio con métricas y analytics.
- **Métodos**:
  ```typescript
  getDashboardMetrics()
  getShipmentMetrics()
  getVehicleUtilization()
  getDriverPerformance()
  getRouteEfficiency()
  exportReport(type, format)
  ```
- **Aceptación**:
  - Coverage >95%
  - Datos correctos

---

### TASK-020: Implementar HealthService
- **ID**: TASK-020
- **Título**: Servicio de health checks
- **Estimación**: 0.5 hora
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 3
- **Dependencias**: TASK-002
- **Descripción**:
  Servicio para verificar salud.
- **Métodos**:
  ```typescript
  checkHealth()
  getServiceStatus(service)
  getPingLatency()
  ```
- **Aceptación**:
  - Coverage >95%

---

### TASK-021: Integración Report & Health con Backend
- **ID**: TASK-021
- **Título**: E2E testing Report & Health Services
- **Estimación**: 0.5 hora
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: TASK-019, TASK-020
- **Descripción**:
  Tests contra endpoints reales.
- **Aceptación**:
  - Endpoints OK
  - Datos correctos

---

## FASE 7: Testing & Documentación (2 horas)

### TASK-022: Tests de Integración End-to-End
- **ID**: TASK-022
- **Título**: E2E: Componente → Service → API
- **Estimación**: 1 hora
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 3
- **Dependencias**: Todas (FASE 1-6)
- **Descripción**:
  Tests completos del flujo completo.
- **Scenarios**:
  1. Login → Token → GET data
  2. Create Shipment → Quote → POST
  3. Handle 401 → Logout
  4. Network Error → Retry
  5. Validation Error → UI
- **Aceptación**:
  - Todos flujos OK
  - Error handling funciona

---

### TASK-023: Documentación de Servicios
- **ID**: TASK-023
- **Título**: README con guía de uso
- **Estimación**: 1 hora
- **Prioridad**: P1 - IMPORTANTE
- **Estado**: ⏳ Pendiente
- **Asignado**: Dev 1
- **Dependencias**: Todas (FASE 1-6)
- **Descripción**:
  Documentación completa de cada servicio.
- **Contenido**:
  - Guía de instalación
  - Ejemplos de uso
  - Error handling
  - Troubleshooting
  - API reference
- **Archivos**:
  - `frontend/src/lib/middleware/README.md`
  - `frontend/src/lib/middleware/services/README.md`
- **Aceptación**:
  - Documentación clara
  - Ejemplos funcionales
  - Coverage 100%

---

### TASK-024: Coverage Testing & Code Review
- **ID**: TASK-024
- **Título**: Verificar cobertura >95% y code quality
- **Estimación**: (incluido en otras tareas)
- **Prioridad**: P0 - CRÍTICO
- **Estado**: ⏳ Pendiente
- **Asignado**: All Devs
- **Dependencias**: Todas
- **Descripción**:
  Verificar que toda cobertura está >95%.
- **Checklist**:
  - [ ] `npm run test -- --coverage`
  - [ ] Coverage >95% globalmente
  - [ ] Branches cubiertos
  - [ ] Líneas cubiertas
  - [ ] Funciones cubiertas
- **Aceptación**:
  - Coverage report OK
  - PR merged

---

## 📊 Sumario por Fase

| Fase | Tasks | Horas | Status |
|------|-------|-------|--------|
| FASE 1 | 004 | 8h | ⏳ |
| FASE 2 | 003 | 6h | ⏳ |
| FASE 3 | 003 | 6h | ⏳ |
| FASE 4 | 004 | 8h | ⏳ |
| FASE 5 | 005 | 8h | ⏳ |
| FASE 6 | 003 | 2h | ⏳ |
| FASE 7 | 003 | 2h | ⏳ |
| **TOTAL** | **24** | **40h** | **⏳** |

---

## 🔗 Dependencias Globales

```
RF-007 depende de:
├── RF-008: State Management (authStore)
├── Validator: Validaciones de entrada
└── Tipos: Tipos compartidos del backend
```

---

## 📅 Timeline Recomendado

```
Semana 1 (Lun-Vie):
  Lun: TASK-001, TASK-002 (4h)
  Mar: TASK-002, TASK-003 (4h)
  Mié: TASK-003, TASK-004 (4h)
  Jue: TASK-004 (2h) + TASK-005 (1h)
  Vie: TASK-005, TASK-006, TASK-007

Semana 2:
  Lun: TASK-008, TASK-009 (4h)
  Mar: TASK-009 (2h), TASK-010 (2h)
  Mié: TASK-011, TASK-012 (4h)
  Jue: TASK-012 (2h), TASK-013 (2h)
  Vie: TASK-013, TASK-014

Semana 3:
  Lun: TASK-015, TASK-016 (3h)
  Mar: TASK-016 (1h), TASK-017 (2h)
  Mié: TASK-017 (1h), TASK-018 (2h)
  Jue: TASK-018 (2h), TASK-019 (1h)
  Vie: TASK-019, TASK-020, TASK-021

Semana 4:
  Lun-Mar: TASK-022 (1h)
  Mié: TASK-023 (1h)
  Jue-Vie: Buffer + Code Review + TASK-024
```

---

## ✅ Criteria de Aceptación Global

- [ ] Todas las 24 tasks completadas
- [ ] Coverage >95% en tests
- [ ] Integración con backend verificada
- [ ] Documentación completa
- [ ] Code review pasado
- [ ] PRs merged a `dev`

---

## 📚 Referencias

- Spec: `spec.md`
- Plan: `plan.md`
- Backend Endpoints: `API-ENDPOINTS-INTERNOS.md`
- RF-008: State Management
- RF-009: Validators & Mappers
