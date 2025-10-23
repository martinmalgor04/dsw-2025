# 📋 RF-003: Servicio de Cotización - Tasks Detallados

## 🎯 Resumen

Implementar endpoint `POST /shipping/cost` con cálculo de costos consultando Stock API, aplicando reglas de peso volumétrico, distancia y tarifas.

## 📊 Tasks por Fase

### **FASE 1: Configuración Base**

#### TASK-001: Setup de Variables de Entorno
- **ID**: TASK-001
- **Título**: Configurar variables de entorno para cotización
- **Estimación**: 2h
- **Prioridad**: Alta
- **Descripción**: Agregar variables de entorno para factor volumétrico, API de distancias, timeouts y caché
- **Criterios de Aceptación**:
  - Variables en `env.example`
  - Configuración en `ConfigService`
  - Validación de variables requeridas
- **Dependencias**: Ninguna

#### TASK-002: Instalación de Dependencias
- **ID**: TASK-002
- **Título**: Instalar dependencias para cálculo de distancias y caché
- **Estimación**: 1h
- **Prioridad**: Alta
- **Descripción**: Instalar librerías para API de distancias, caché Redis y validaciones
- **Criterios de Aceptación**:
  - `axios` para HTTP requests
  - `@nestjs/cache-manager` para caché
  - `cache-manager-redis-store` para Redis
  - `class-validator` y `class-transformer` actualizados
- **Dependencias**: Ninguna

#### TASK-003: Configuración de Caché
- **ID**: TASK-003
- **Título**: Configurar caché para productos y distancias
- **Estimación**: 1h
- **Prioridad**: Alta
- **Descripción**: Setup de Redis para caché de productos y distancias
- **Criterios de Aceptación**:
  - Módulo de caché configurado
  - TTL configurable para productos (10min) y distancias (1h)
  - Fallback a memoria si Redis no disponible
- **Dependencias**: TASK-002

---

### **FASE 2: Servicios Core**

#### TASK-004: DistanceCalculationService
- **ID**: TASK-004
- **Título**: Implementar servicio de cálculo de distancias
- **Estimación**: 6h
- **Prioridad**: Alta
- **Descripción**: Servicio para calcular distancia entre códigos postales usando API externa
- **Criterios de Aceptación**:
  - Método `calculateDistance(fromPostalCode, toPostalCode)`
  - Integración con API de geocoding/distancia
  - Caché de resultados frecuentes
  - Manejo de errores y fallback
  - Tests unitarios con mocks
- **Dependencias**: TASK-003

#### TASK-005: TariffCalculationService
- **ID**: TASK-005
- **Título**: Implementar servicio de cálculo de tarifas
- **Estimación**: 4h
- **Prioridad**: Alta
- **Descripción**: Servicio para aplicar tarifas según método de transporte, peso y distancia
- **Criterios de Aceptación**:
  - Método `calculateTariff(transportType, weight, distance)`
  - Integración con Config Service para obtener tarifas
  - Fórmula: `base + (peso × tarifa/kg) + (distancia × tarifa/km)`
  - Validación de tarifas válidas
  - Tests unitarios
- **Dependencias**: TASK-001

#### TASK-006: CoverageValidationService
- **ID**: TASK-006
- **Título**: Implementar servicio de validación de cobertura
- **Estimación**: 3h
- **Prioridad**: Alta
- **Descripción**: Servicio para validar si una zona postal está cubierta por un método de transporte
- **Criterios de Aceptación**:
  - Método `validateZone(postalCode, transportType)`
  - Integración con Coverage Zone Service
  - Validación de formato de código postal argentino
  - Manejo de zonas no cubiertas
  - Tests unitarios
- **Dependencias**: TASK-001

#### TASK-006B: PostalCodeValidationService
- **ID**: TASK-006B
- **Título**: Implementar servicio de validación de códigos postales
- **Estimación**: 2h
- **Prioridad**: Alta
- **Descripción**: Servicio para validar formato de códigos postales argentinos (CPA)
- **Criterios de Aceptación**:
  - Método `validatePostalCode(postalCode)`
  - Validación de formato: `^([A-Z]{1}\d{4}[A-Z]{3})$`
  - Validación de códigos postales de delivery_address
  - Validación de códigos postales de depósitos desde Stock API
  - Manejo de códigos postales inválidos
  - Tests unitarios con casos válidos e inválidos
- **Dependencias**: TASK-001

#### TASK-007: ProductDataService
- **ID**: TASK-007
- **Título**: Implementar wrapper para datos de productos
- **Estimación**: 4h
- **Prioridad**: Alta
- **Descripción**: Servicio wrapper sobre Stock Integration con caché y fallback
- **Criterios de Aceptación**:
  - Método `getProductData(productId)` con caché
  - Integración con Stock Integration Service
  - Fallback a datos por defecto si Stock no responde
  - Flag `estimated` cuando se usan datos por defecto
  - Tests unitarios con mocks
- **Dependencias**: TASK-003

---

### **FASE 3: Lógica de Negocio**

#### TASK-008: Cálculo de Peso Volumétrico
- **ID**: TASK-008
- **Título**: Implementar cálculo de peso volumétrico
- **Estimación**: 3h
- **Prioridad**: Alta
- **Descripción**: Lógica para calcular peso volumétrico usando factor configurable
- **Criterios de Aceptación**:
  - Fórmula: `(largo × ancho × alto) / 1,000,000 × factor`
  - Factor configurable por variable de entorno
  - Cálculo por producto y total
  - Tests unitarios con diferentes dimensiones
- **Dependencias**: TASK-007

#### TASK-009: Cálculo de Peso Facturable
- **ID**: TASK-009
- **Título**: Implementar cálculo de peso facturable
- **Estimación**: 2h
- **Prioridad**: Alta
- **Descripción**: Lógica para determinar peso facturable (máximo entre real y volumétrico)
- **Criterios de Aceptación**:
  - Fórmula: `max(pesoReal, pesoVolumétrico)`
  - Cálculo por producto y total
  - Tests unitarios con diferentes escenarios
- **Dependencias**: TASK-008

#### TASK-010: ShippingQuoteService Core
- **ID**: TASK-010
- **Título**: Implementar servicio principal de cotización
- **Estimación**: 8h
- **Prioridad**: Crítica
- **Descripción**: Servicio principal que orquesta todo el proceso de cotización
- **Criterios de Aceptación**:
  - Método `calculateQuote(request)` principal
  - Orquestación de todos los servicios
  - Cálculo de costos por producto
  - Validación de cobertura antes de cotizar
  - Manejo de errores y timeouts
  - Respuesta en < 3 segundos
  - Tests de integración completos
- **Dependencias**: TASK-004, TASK-005, TASK-006, TASK-006B, TASK-009

---

### **FASE 4: Controller y DTOs**

#### TASK-011: DTOs de Request/Response
- **ID**: TASK-011
- **Título**: Crear DTOs para request y response
- **Estimación**: 2h
- **Prioridad**: Alta
- **Descripción**: DTOs con validaciones para ShippingCostRequest y ShippingCostResponse
- **Criterios de Aceptación**:
  - `ShippingCostRequestDto` con validaciones
  - `ShippingCostResponseDto` con breakdown opcional
  - Validación de formato de código postal argentino (CPA)
  - Validación de array de productos no vacío
  - Integración con PostalCodeValidationService
  - Tests de validación
- **Dependencias**: Ninguna

#### TASK-012: ShippingQuoteController
- **ID**: TASK-012
- **Título**: Implementar controller REST
- **Estimación**: 4h
- **Prioridad**: Alta
- **Descripción**: Controller para endpoint POST /shipping/cost
- **Criterios de Aceptación**:
  - Endpoint `POST /shipping/cost`
  - Validación de DTOs
  - Manejo de errores HTTP
  - Códigos de estado correctos
  - Documentación OpenAPI
  - Tests de integración
- **Dependencias**: TASK-010, TASK-011, TASK-006B

---

### **FASE 5: Testing**

#### TASK-013: Tests Unitarios de Servicios
- **ID**: TASK-013
- **Título**: Tests unitarios para todos los servicios
- **Estimación**: 6h
- **Prioridad**: Alta
- **Descripción**: Tests unitarios con mocks para todos los servicios implementados
- **Criterios de Aceptación**:
  - Tests para DistanceCalculationService
  - Tests para TariffCalculationService
  - Tests para CoverageValidationService
  - Tests para PostalCodeValidationService
  - Tests para ProductDataService
  - Tests para ShippingQuoteService
  - Cobertura > 90%
  - Mocks para dependencias externas
- **Dependencias**: TASK-010

#### TASK-014: Tests de Integración
- **ID**: TASK-014
- **Título**: Tests de integración del endpoint completo
- **Estimación**: 4h
- **Prioridad**: Alta
- **Descripción**: Tests end-to-end del endpoint con mocks de servicios externos
- **Criterios de Aceptación**:
  - Test del endpoint completo
  - Mock de Stock API
  - Mock de API de distancias
  - Test de caché
  - Test de circuit breaker
  - Test de timeout
  - Test de respuesta < 3 segundos
- **Dependencias**: TASK-012

#### TASK-015: Tests de Performance
- **ID**: TASK-015
- **Título**: Tests de performance y carga
- **Estimación**: 2h
- **Prioridad**: Media
- **Descripción**: Tests para verificar performance bajo carga
- **Criterios de Aceptación**:
  - Test de respuesta < 3 segundos
  - Test de carga con múltiples productos
  - Test de requests concurrentes
  - Test de memory usage
  - Benchmark de caché
- **Dependencias**: TASK-014

---

### **FASE 6: Optimización y Documentación**

#### TASK-016: Optimizaciones de Performance
- **ID**: TASK-016
- **Título**: Optimizar performance del servicio
- **Estimación**: 3h
- **Prioridad**: Media
- **Descripción**: Optimizaciones para mejorar tiempo de respuesta
- **Criterios de Aceptación**:
  - Consultas paralelas a Stock API
  - Caché optimizado
  - Cálculos optimizados
  - Memory usage optimizado
  - Respuesta < 3 segundos garantizada
- **Dependencias**: TASK-015

#### TASK-017: Documentación OpenAPI
- **ID**: TASK-017
- **Título**: Actualizar documentación OpenAPI
- **Estimación**: 1h
- **Prioridad**: Media
- **Descripción**: Actualizar especificación OpenAPI con el nuevo endpoint
- **Criterios de Aceptación**:
  - Endpoint documentado en `openapilog.yaml`
  - Ejemplos de request/response
  - Códigos de error documentados
  - Validación de especificación
- **Dependencias**: TASK-012

#### TASK-018: README y Ejemplos
- **ID**: TASK-018
- **Título**: Crear documentación y ejemplos de uso
- **Estimación**: 2h
- **Prioridad**: Media
- **Descripción**: Documentación completa con ejemplos de uso
- **Criterios de Aceptación**:
  - README con guía de uso
  - Ejemplos de integración
  - Troubleshooting guide
  - Health checks documentados
- **Dependencias**: TASK-016

#### TASK-019: Health Checks
- **ID**: TASK-019
- **Título**: Implementar health checks
- **Estimación**: 1h
- **Prioridad**: Media
- **Descripción**: Health checks para monitoreo del servicio
- **Criterios de Aceptación**:
  - Health check del endpoint
  - Estado de dependencias (Stock API, Redis, etc.)
  - Métricas de performance
  - Tests de health check
- **Dependencias**: TASK-016

---

## 📊 Resumen de Tasks

| Fase | Tasks | Estimación | Prioridad |
|------|-------|------------|-----------|
| Configuración Base | 3 | 4h | Alta |
| Servicios Core | 5 | 19h | Alta |
| Lógica de Negocio | 3 | 13h | Crítica |
| Controller y DTOs | 2 | 6h | Alta |
| Testing | 3 | 12h | Alta |
| Optimización | 4 | 7h | Media |
| **TOTAL** | **20** | **61h** | - |

## 🎯 Criterios de Éxito

### Funcionales
- ✅ Endpoint `POST /shipping/cost` funcional
- ✅ Cálculo de costos preciso
- ✅ Validación de cobertura
- ✅ Respuesta en < 3 segundos
- ✅ Flag `estimated` cuando corresponde

### Técnicos
- ✅ Cobertura de tests > 90%
- ✅ Documentación completa
- ✅ Health checks funcionales
- ✅ Performance optimizada
- ✅ Manejo de errores robusto

### Negocio
- ✅ Integración con Stock API
- ✅ Aplicación correcta de tarifas
- ✅ Validación de zonas de cobertura
- ✅ Caché para optimización
- ✅ Fallback a datos por defecto

---

**Duración Total**: 8 días (61 horas)  
**Recursos**: 1 desarrollador backend  
**Dependencias**: RF-001, RF-002 completados
