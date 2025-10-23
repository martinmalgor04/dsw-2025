# 📋 Plan de Implementación - RF-007: Servicios HTTP

## 🎯 Información General

| Aspecto | Detalle |
|---------|---------|
| **RF** | RF-007 |
| **Duración Total** | 40 horas |
| **Equipo** | 3 personas (Middleware Team) |
| **Metodología** | TDD + Integración con Backend |
| **Hito Final** | Todos los servicios integrados con UI |

---

## 📅 Fases de Implementación

### **FASE 1: Configuración Base & HTTP Client (8 horas)**

#### Objetivo
Establecer la capa base de comunicación HTTP con configuración centralizada, interceptores y manejo de errores.

#### Subtareas

1. **Setup del proyecto TypeScript** (1h)
   - Configurar ESLint + Prettier
   - Tipos globales para API responses
   - Configuración de paths alias (`@/*`)

2. **HTTP Client Base** (3h)
   - Clase `HttpClient` con métodos core (get, post, patch, delete)
   - Configuración del cliente (baseURL, timeout, headers)
   - Soporte para interceptadores
   - Tests unitarios (>95% coverage)

3. **Error Handling** (2h)
   - Clase `ApiError` base
   - Tipos de errores específicos
   - Mapeo automático HTTP code → Error type
   - Tests de mapeo de errores

4. **Retry Logic** (2h)
   - Estrategia exponential backoff
   - Aplicar solo a GET requests
   - Tests de reintentos

#### Deliverables
- ✅ `http/http-client.ts` con tests
- ✅ `errors/api-error.ts` y tipos
- ✅ `interceptors/retry.ts`
- ✅ Configuración centralizada

#### Done Criteria
- [ ] HttpClient crea requests correctamente
- [ ] Retry logic reintentan automáticamente
- [ ] Errores se mapean correctamente
- [ ] Tests pasan al 100%

---

### **FASE 2: Interceptores & Logging (6 horas)**

#### Objetivo
Implementar request/response interceptors y logging centralizado.

#### Subtareas

1. **Request Interceptor** (2h)
   - Inyección automática de JWT
   - Headers comunes (User-Agent, Accept-Language)
   - Transformación de datos
   - Tests de inyección de token

2. **Response Interceptor** (2h)
   - Mapeo de errores HTTP
   - Detección de 401 → logout
   - Transformación de datos
   - Logging de responses

3. **Logger Centralizado** (2h)
   - Niveles de log (info, debug, warn, error)
   - Captura de metadata (timestamp, method, url, etc)
   - Persistencia en localStorage (opcional)
   - Tests de logging

#### Deliverables
- ✅ `interceptors/request.ts`
- ✅ `interceptors/response.ts`
- ✅ `utils/logger.ts`
- ✅ Tests de interceptadores

#### Done Criteria
- [ ] JWT se inyecta en cada request
- [ ] 401 → logout automático
- [ ] Logs se generan correctamente
- [ ] Tests pasan al 100%

---

### **FASE 3: Config Service (6 horas)**

#### Objetivo
Implementar servicio para configuraciones (métodos de transporte y zonas).

#### Subtareas

1. **DTOs y Tipos** (1h)
   - `TransportMethodDTO`
   - `CoverageZoneDTO`
   - Tipos de filtros y respuestas

2. **ConfigService** (3h)
   - Métodos de transporte (GET list, GET by ID, POST, PATCH)
   - Zonas de cobertura (GET list, GET by ID, POST, PATCH)
   - Validación de entrada
   - Tests unitarios

3. **Integración con Backend** (2h)
   - Probar cada endpoint contra Operator Interface (3004)
   - Tests de integración
   - Documentación de errores

#### Deliverables
- ✅ `services/config.service.ts`
- ✅ DTOs tipados
- ✅ Tests unitarios e integración

#### Done Criteria
- [ ] GET /config/transport-methods funciona
- [ ] POST /config/coverage-zones funciona
- [ ] Validaciones se aplican
- [ ] Tests pasan al 100%

---

### **FASE 4: Shipment Service (8 horas)**

#### Objetivo
Implementar servicio para envíos y cotizaciones.

#### Subtareas

1. **DTOs y Tipos** (1h)
   - `ShipmentDTO`
   - `CreateShipmentDTO`
   - `QuoteRequestDTO` / `QuoteResponseDTO`

2. **CRUD Básico** (3h)
   - GET /shipments (con filtros)
   - GET /shipments/:id
   - POST /shipments
   - PATCH /shipments/:id
   - DELETE /shipments/:id

3. **Quotation** (3h)
   - POST /shipments/quote/calculate
   - Historia de cotizaciones
   - Cache de cotizaciones (opcional)

4. **Tests e Integración** (1h)
   - Tests unitarios
   - Tests de integración
   - Documentación

#### Deliverables
- ✅ `services/shipment.service.ts`
- ✅ DTOs completos
- ✅ Tests integración

#### Done Criteria
- [ ] Todos los endpoints CRUD funcionan
- [ ] Cotizaciones calculan correctamente
- [ ] Filtros se aplican
- [ ] Tests al 100%

---

### **FASE 5: Vehicle, Driver & Route Services (8 horas)**

#### Objetivo
Implementar servicios para vehículos, conductores y rutas.

#### Subtareas

1. **VehicleService** (2h)
   - CRUD vehículos
   - Filtros por estado
   - DTOs y tipos

2. **DriverService** (2h)
   - CRUD conductores
   - Filtros por estado
   - DTOs y tipos

3. **RouteService** (3h)
   - CRUD rutas
   - Route stops (GET, POST)
   - Filtros complejos

4. **Tests e Integración** (1h)
   - Tests unitarios
   - Integración backend

#### Deliverables
- ✅ `services/vehicle.service.ts`
- ✅ `services/driver.service.ts`
- ✅ `services/route.service.ts`
- ✅ Tests completos

#### Done Criteria
- [ ] Servicios completamente funcionales
- [ ] Tests al 100%
- [ ] Integración con backend OK

---

### **FASE 6: Report & Health Services (2 horas)**

#### Objetivo
Implementar servicios para reportes y health checks.

#### Subtareas

1. **ReportService** (1h)
   - Dashboard metrics
   - Shipment metrics
   - Vehicle/Driver/Route efficiency
   - Export reports

2. **HealthService** (0.5h)
   - Health check
   - Service status

3. **Tests** (0.5h)
   - Tests unitarios
   - Mock de datos

#### Deliverables
- ✅ `services/report.service.ts`
- ✅ `services/health.service.ts`
- ✅ Tests

#### Done Criteria
- [ ] Servicios funcionales
- [ ] Tests al 100%

---

### **FASE 7: Testing Integral & Documentación (2 horas)**

#### Objetivo
Asegurar cobertura de tests y documentación completa.

#### Subtareas

1. **Tests de Integración End-to-End** (1h)
   - Flujo completo: Componente → Service → API
   - Mock del backend
   - Casos de error

2. **Documentación** (1h)
   - Guía de uso de cada servicio
   - Ejemplos de código
   - Troubleshooting

#### Deliverables
- ✅ Tests integración
- ✅ Documentación README
- ✅ Ejemplos de uso

#### Done Criteria
- [ ] Cobertura >95%
- [ ] Documentación completa
- [ ] Ejemplos claros

---

## 🔄 Dependencias entre Fases

```
FASE 1 (Config Base)
    ↓
FASE 2 (Interceptadores)
    ↓
FASE 3 (Config Service) ← Consume FASE 1 + 2
    ↓
FASE 4 (Shipment Service) ← Consume FASE 1 + 2
    ↓ 
FASE 5 (Other Services) ← Consume FASE 1 + 2
    ↓
FASE 6 (Reports & Health) ← Consume FASE 1 + 2
    ↓
FASE 7 (Testing & Docs)
```

---

## 👥 Asignación de Equipo (3 personas)

| Persona | Fase 1 | Fase 2 | Fase 3 | Fase 4 | Fase 5 | Fase 6 | Fase 7 |
|---------|--------|--------|--------|--------|--------|--------|--------|
| Dev 1   | HTTP   | Logger | Config | Ship   | -      | -      | Tests  |
| Dev 2   | Errors | Request| Config | Ship   | Vehicle| Report | Docs   |
| Dev 3   | Retry  | Response| -     | -      | Driver | Health | E2E    |

---

## 📊 Timeline

```
Semana 1:
  Lun-Jue: FASE 1 (8h)
  Vie: FASE 2 inicio (2h)

Semana 2:
  Lun-Mié: FASE 2 resto + FASE 3 (6+6h)
  Jue-Vie: FASE 4 (4h)

Semana 3:
  Lun-Mié: FASE 4 resto + FASE 5 (4+4h)
  Jue-Vie: FASE 5 resto + FASE 6 (4+2h)

Semana 4:
  Lun-Mar: FASE 6 resto + FASE 7 (0+2h)
  Mié-Vie: FASE 7 E2E + Buffer
```

---

## ✅ Checklist de Implementación

### FASE 1
- [ ] TypeScript configurado
- [ ] HttpClient clase implementada
- [ ] Métodos core (get, post, patch, delete) funcionales
- [ ] Error mapping implementado
- [ ] Retry logic funcionando
- [ ] Tests >95% coverage

### FASE 2
- [ ] Request interceptor inyecta JWT
- [ ] Response interceptor mapea errores
- [ ] Logout automático en 401
- [ ] Logger captura metadata
- [ ] Tests pasan

### FASE 3
- [ ] ConfigService GET transport-methods
- [ ] ConfigService POST/PATCH transport-methods
- [ ] ConfigService GET coverage-zones
- [ ] ConfigService POST/PATCH coverage-zones
- [ ] Tests de integración OK

### FASE 4
- [ ] ShipmentService CRUD completo
- [ ] Quote calculation funciona
- [ ] Filtros aplicados
- [ ] Tests de integración OK

### FASE 5
- [ ] VehicleService completo
- [ ] DriverService completo
- [ ] RouteService completo
- [ ] Tests de integración OK

### FASE 6
- [ ] ReportService implementado
- [ ] HealthService implementado
- [ ] Tests OK

### FASE 7
- [ ] Cobertura >95%
- [ ] Documentación README
- [ ] Ejemplos de uso
- [ ] E2E tests

---

## 🚀 Criterios de Éxito Final

| Criterio | Métrica | Status |
|----------|---------|--------|
| Funcionalidad | Todos los servicios operativos | ⏳ |
| Calidad | Tests >95% coverage | ⏳ |
| Performance | Latencia <500ms promedio | ⏳ |
| Documentación | 100% de métodos documentados | ⏳ |
| Integración | Backend + Frontend OK | ⏳ |

---

## 📝 Notas Importantes

1. **TDD**: Escribir tests antes de código
2. **Integración**: Probar contra backend real regularmente
3. **Comunicación**: Sincronizaciones diarias (15 min standup)
4. **Code Review**: PR antes de merge
5. **Documentación**: En tiempo real (no dejar para el final)

---

## 🔗 Referencias

- Spec: `spec.md` (en este directorio)
- Backend: `backend/docs/README.md`
- Endpoints: `API-ENDPOINTS-INTERNOS.md`
- RF-008: State Management (Stores)
- RF-009: Validators & Mappers
