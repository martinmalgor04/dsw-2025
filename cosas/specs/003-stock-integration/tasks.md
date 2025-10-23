# Tasks Detallados - RF-002: Integración con Stock

## 📋 **Resumen de Tasks**

Este documento detalla todos los tasks específicos para implementar la integración con Stock API, organizados por fases y con criterios de aceptación claros.

## 🎯 **Tasks por Fase**

### **Fase 1: Configuración Base**

#### **Task 1.1: Setup Inicial del Módulo**
- **ID**: TASK-001
- **Título**: Crear estructura base del módulo Stock Integration
- **Estimación**: 4 horas
- **Prioridad**: Alta

**Descripción:**
Crear la estructura de carpetas y archivos base para el módulo de integración con Stock.

**Criterios de Aceptación:**
- [ ] Crear carpeta `backend/src/stock-integration/`
- [ ] Crear subcarpetas: `services/`, `dto/`, `interfaces/`, `guards/`, `interceptors/`, `__tests__/`
- [ ] Crear archivo `stock-integration.module.ts` básico
- [ ] Configurar exports e imports básicos
- [ ] Verificar que el módulo se compile sin errores

**Entregables:**
- Estructura de carpetas creada
- Módulo base funcional
- Documentación de estructura

---

#### **Task 1.2: Configuración de Variables de Entorno**
- **ID**: TASK-002
- **Título**: Configurar variables de entorno para Stock API
- **Estimación**: 2 horas
- **Prioridad**: Alta

**Descripción:**
Configurar todas las variables de entorno necesarias para la integración con Stock API.

**Criterios de Aceptación:**
- [ ] Agregar variables de Stock API a `.env.example`
- [ ] Agregar variables de Circuit Breaker
- [ ] Agregar variables de Cache/Redis
- [ ] Agregar variables de Keycloak
- [ ] Documentar cada variable con su propósito
- [ ] Crear validación de variables requeridas

**Entregables:**
- Archivo `.env.example` actualizado
- Validación de configuración
- Documentación de variables

---

#### **Task 1.3: Instalación de Dependencias**
- **ID**: TASK-003
- **Título**: Instalar dependencias necesarias para Stock Integration
- **Estimación**: 1 hora
- **Prioridad**: Alta

**Descripción:**
Instalar todas las dependencias npm necesarias para el módulo de integración.

**Criterios de Aceptación:**
- [ ] Instalar `@nestjs/axios` para cliente HTTP
- [ ] Instalar `@nestjs/cache-manager` para caché
- [ ] Instalar `cache-manager-redis-store` para Redis
- [ ] Instalar `keycloak-connect` para autenticación
- [ ] Instalar `nest-keycloak-connect` para integración NestJS
- [ ] Instalar dependencias de desarrollo: `@types/keycloak-connect`, `nock`
- [ ] Verificar que todas las dependencias se instalen correctamente

**Entregables:**
- `package.json` actualizado
- `package-lock.json` actualizado
- Dependencias instaladas y funcionando

---

#### **Task 1.4: Configuración de HttpModule**
- **ID**: TASK-004
- **Título**: Configurar HttpModule de NestJS para Stock API
- **Estimación**: 2 horas
- **Prioridad**: Alta

**Descripción:**
Configurar el HttpModule de NestJS con timeouts, interceptors y configuración específica para Stock API.

**Criterios de Aceptación:**
- [ ] Configurar HttpModule con timeout de 2 segundos
- [ ] Configurar maxRedirects a 3
- [ ] Configurar headers por defecto
- [ ] Configurar baseURL para Stock API
- [ ] Crear configuración dinámica desde variables de entorno
- [ ] Agregar logging de requests HTTP

**Entregables:**
- HttpModule configurado
- Configuración dinámica implementada
- Logging de requests funcionando

---

#### **Task 1.5: Setup Básico de Redis**
- **ID**: TASK-005
- **Título**: Configurar conexión básica a Redis
- **Estimación**: 3 horas
- **Prioridad**: Media

**Descripción:**
Configurar la conexión básica a Redis para el sistema de caché.

**Criterios de Aceptación:**
- [ ] Configurar CacheModule con Redis store
- [ ] Configurar conexión a Redis desde variables de entorno
- [ ] Implementar manejo de errores de conexión
- [ ] Crear fallback a memoria local si Redis no está disponible
- [ ] Agregar health check para Redis
- [ ] Configurar TTL por defecto de 10 minutos

**Entregables:**
- Redis configurado y funcionando
- Fallback a memoria local implementado
- Health check funcionando

---

### **Fase 2: Servicios Core**

#### **Task 2.1: Implementar StockCircuitBreakerService**
- **ID**: TASK-006
- **Título**: Crear servicio de Circuit Breaker para Stock API
- **Estimación**: 6 horas
- **Prioridad**: Alta

**Descripción:**
Implementar el servicio de circuit breaker con estados CLOSED, OPEN, HALF_OPEN y umbral de 5 fallos.

**Criterios de Aceptación:**
- [ ] Implementar estados: CLOSED, OPEN, HALF_OPEN
- [ ] Configurar umbral de 5 fallos consecutivos
- [ ] Implementar timeout de recuperación de 30 segundos
- [ ] Crear método `isOpen()` para verificar estado
- [ ] Crear método `recordSuccess()` para registrar éxito
- [ ] Crear método `recordFailure()` para registrar fallo
- [ ] Implementar transición automática de OPEN a HALF_OPEN
- [ ] Agregar logging de cambios de estado
- [ ] Crear tests unitarios completos

**Entregables:**
- `StockCircuitBreakerService` implementado
- Tests unitarios con cobertura > 90%
- Documentación del servicio

---

#### **Task 2.2: Implementar StockCacheService**
- **ID**: TASK-007
- **Título**: Crear servicio de caché para Stock API
- **Estimación**: 4 horas
- **Prioridad**: Alta

**Descripción:**
Implementar el servicio de caché con Redis, TTL de 10 minutos y claves estructuradas.

**Criterios de Aceptación:**
- [ ] Implementar método `get(key: string)` para obtener del caché
- [ ] Implementar método `set(key: string, value: any, ttl?: number)` para guardar
- [ ] Implementar método `delete(key: string)` para eliminar
- [ ] Implementar método `clear()` para limpiar caché
- [ ] Crear claves estructuradas: `stock:product:{id}`, `stock:reserva:{id}`
- [ ] Configurar TTL por defecto de 10 minutos
- [ ] Implementar serialización/deserialización JSON
- [ ] Agregar logging de operaciones de caché
- [ ] Crear tests unitarios completos

**Entregables:**
- `StockCacheService` implementado
- Tests unitarios con cobertura > 90%
- Documentación del servicio

---

#### **Task 2.3: Implementar StockIntegrationService**
- **ID**: TASK-008
- **Título**: Crear servicio principal de integración con Stock API
- **Estimación**: 8 horas
- **Prioridad**: Alta

**Descripción:**
Implementar el servicio principal que consume la API de Stock con circuit breaker, caché y manejo de errores.

**Criterios de Aceptación:**
- [ ] Implementar método `getProductById(productId: number)` - Obtener datos de producto
- [ ] Implementar método `getReservaByCompraId(compraId: string, userId: number)` - Buscar reserva por idCompra
- [ ] Implementar método `getReservaById(reservaId: number, userId: number)` - Obtener reserva por ID
- [ ] Implementar método `updateReservaStatus(reservaId, estado, userId)` - Actualizar estado
- [ ] Integrar con StockCircuitBreakerService
- [ ] Integrar con StockCacheService
- [ ] Implementar reintentos con backoff exponencial
- [ ] Implementar fallbacks para productos no disponibles
- [ ] Agregar logging estructurado
- [ ] Crear tests unitarios completos

**Entregables:**
- `StockIntegrationService` implementado
- Tests unitarios con cobertura > 90%
- Documentación del servicio

---

### **Fase 3: DTOs e Interfaces**

#### **Task 3.1: Crear DTOs para ProductoStock**
- **ID**: TASK-009
- **Título**: Crear DTOs y validaciones para productos de Stock
- **Estimación**: 3 horas
- **Prioridad**: Media

**Descripción:**
Crear DTOs con validaciones para los datos de productos que vienen de Stock API.

**Criterios de Aceptación:**
- [ ] Crear `ProductoStockDto` con todas las propiedades
- [ ] Crear `DimensionesDto` para dimensiones del producto
- [ ] Crear `UbicacionAlmacenDto` para ubicación
- [ ] Crear `ImagenProductoDto` para imágenes
- [ ] Crear `CategoriaDto` para categorías
- [ ] Agregar validaciones con class-validator
- [ ] Agregar documentación con Swagger
- [ ] Crear ejemplos de uso
- [ ] Crear tests de validación

**Entregables:**
- DTOs de productos implementados
- Validaciones funcionando
- Documentación Swagger

---

#### **Task 3.2: Crear DTOs para ReservaStock**
- **ID**: TASK-010
- **Título**: Crear DTOs y validaciones para reservas de Stock
- **Estimación**: 3 horas
- **Prioridad**: Media

**Descripción:**
Crear DTOs con validaciones para los datos de reservas que vienen de Stock API.

**Criterios de Aceptación:**
- [ ] Crear `ReservaStockDto` con todas las propiedades
- [ ] Crear `ReservaProductoDto` para productos en reserva
- [ ] Crear `ActualizarReservaDto` para actualizaciones
- [ ] Crear enum `EstadoReserva` (confirmado, pendiente, cancelado)
- [ ] Agregar validaciones con class-validator
- [ ] Agregar documentación con Swagger
- [ ] Crear ejemplos de uso
- [ ] Crear tests de validación

**Entregables:**
- DTOs de reservas implementados
- Validaciones funcionando
- Documentación Swagger

---

#### **Task 3.3: Crear Interfaces de API**
- **ID**: TASK-011
- **Título**: Crear interfaces TypeScript para Stock API
- **Estimación**: 2 horas
- **Prioridad**: Media

**Descripción:**
Crear interfaces TypeScript que definan la estructura de datos de Stock API.

**Criterios de Aceptación:**
- [ ] Crear `IStockApiResponse` para respuestas genéricas
- [ ] Crear `IStockApiError` para errores
- [ ] Crear `IStockApiConfig` para configuración
- [ ] Crear `ICircuitBreakerState` para estados
- [ ] Crear `ICacheConfig` para configuración de caché
- [ ] Agregar documentación JSDoc
- [ ] Crear tests de tipos

**Entregables:**
- Interfaces TypeScript implementadas
- Documentación JSDoc
- Tests de tipos

---

### **Fase 4: Interceptors y Guards**

#### **Task 4.1: Implementar StockRetryInterceptor**
- **ID**: TASK-012
- **Título**: Crear interceptor de reintentos para Stock API
- **Estimación**: 4 horas
- **Prioridad**: Media

**Descripción:**
Implementar interceptor que maneje reintentos automáticos con backoff exponencial.

**Criterios de Aceptación:**
- [ ] Implementar backoff exponencial (1s, 2s, 4s)
- [ ] Configurar máximo de 3 intentos
- [ ] Implementar delay entre reintentos
- [ ] Manejar errores específicos para reintentos
- [ ] Agregar logging de reintentos
- [ ] Crear tests unitarios
- [ ] Documentar configuración

**Entregables:**
- Interceptor de reintentos implementado
- Tests unitarios
- Documentación

---

#### **Task 4.2: Implementar StockLoggingInterceptor**
- **ID**: TASK-013
- **Título**: Crear interceptor de logging para Stock API
- **Estimación**: 3 horas
- **Prioridad**: Media

**Descripción:**
Implementar interceptor que genere logs estructurados para todas las requests a Stock API.

**Criterios de Aceptación:**
- [ ] Loggear inicio de request con timestamp
- [ ] Loggear fin de request con duración
- [ ] Loggear errores con detalles
- [ ] Incluir información de circuit breaker
- [ ] Incluir información de caché
- [ ] Formato JSON estructurado
- [ ] Configurar niveles de log
- [ ] Crear tests unitarios

**Entregables:**
- Interceptor de logging implementado
- Tests unitarios
- Documentación

---

#### **Task 4.3: Implementar StockAuthGuard**
- **ID**: TASK-014
- **Título**: Crear guard de autenticación para Stock API
- **Estimación**: 5 horas
- **Prioridad**: Alta

**Descripción:**
Implementar guard que maneje autenticación JWT con Keycloak para Stock API.

**Criterios de Aceptación:**
- [ ] Implementar obtención de token JWT
- [ ] Implementar refresh automático de tokens
- [ ] Validar scopes requeridos
- [ ] Manejar errores de autenticación
- [ ] Implementar cache de tokens
- [ ] Agregar logging de autenticación
- [ ] Crear tests unitarios
- [ ] Documentar configuración

**Entregables:**
- Guard de autenticación implementado
- Tests unitarios
- Documentación

---

### **Fase 5: Testing**

#### **Task 5.1: Tests Unitarios para StockIntegrationService**
- **ID**: TASK-015
- **Título**: Crear tests unitarios completos para StockIntegrationService
- **Estimación**: 6 horas
- **Prioridad**: Alta

**Descripción:**
Crear suite completa de tests unitarios para el servicio principal de integración.

**Criterios de Aceptación:**
- [ ] Test de `getProductById` con caché hit
- [ ] Test de `getProductById` con caché miss
- [ ] Test de `getProductById` con circuit breaker abierto
- [ ] Test de `getProductById` con fallback
- [ ] Test de `getReservaByCompraId` exitoso
- [ ] Test de `getReservaByCompraId` no encontrado
- [ ] Test de `updateReservaStatus` exitoso
- [ ] Test de manejo de errores HTTP
- [ ] Test de reintentos automáticos
- [ ] Cobertura > 90%

**Entregables:**
- Tests unitarios completos
- Cobertura > 90%
- Mocks de Stock API

---

#### **Task 5.2: Tests Unitarios para StockCircuitBreakerService**
- **ID**: TASK-016
- **Título**: Crear tests unitarios para StockCircuitBreakerService
- **Estimación**: 4 horas
- **Prioridad**: Alta

**Descripción:**
Crear tests unitarios para el servicio de circuit breaker.

**Criterios de Aceptación:**
- [ ] Test de estado inicial CLOSED
- [ ] Test de transición a OPEN tras 5 fallos
- [ ] Test de transición a HALF_OPEN tras timeout
- [ ] Test de transición a CLOSED tras éxito
- [ ] Test de conteo de fallos
- [ ] Test de reset de contador
- [ ] Test de timeout de recuperación
- [ ] Cobertura > 90%

**Entregables:**
- Tests unitarios completos
- Cobertura > 90%
- Documentación de tests

---

#### **Task 5.3: Tests Unitarios para StockCacheService**
- **ID**: TASK-017
- **Título**: Crear tests unitarios para StockCacheService
- **Estimación**: 3 horas
- **Prioridad**: Media

**Descripción:**
Crear tests unitarios para el servicio de caché.

**Criterios de Aceptación:**
- [ ] Test de operación GET exitosa
- [ ] Test de operación SET exitosa
- [ ] Test de operación DELETE exitosa
- [ ] Test de operación CLEAR exitosa
- [ ] Test de TTL funcionando
- [ ] Test de serialización/deserialización
- [ ] Test de manejo de errores de Redis
- [ ] Cobertura > 90%

**Entregables:**
- Tests unitarios completos
- Cobertura > 90%
- Documentación de tests

---

#### **Task 5.4: Tests de Integración con Stock API**
- **ID**: TASK-018
- **Título**: Crear tests de integración con Stock API real
- **Estimación**: 8 horas
- **Prioridad**: Media

**Descripción:**
Crear tests de integración que consuman la API real de Stock (cuando esté disponible).

**Criterios de Aceptación:**
- [ ] Test de autenticación con Keycloak
- [ ] Test de obtención de producto real
- [ ] Test de obtención de reserva real
- [ ] Test de actualización de reserva real
- [ ] Test de manejo de errores HTTP reales
- [ ] Test de circuit breaker en acción
- [ ] Test de caché en acción
- [ ] Test de performance
- [ ] Documentación de setup

**Entregables:**
- Tests de integración completos
- Documentación de setup
- Guías de troubleshooting

---

### **Fase 6: Integración y Documentación**

#### **Task 6.1: Integrar con Módulos Existentes**
- **ID**: TASK-019
- **Título**: Integrar StockIntegrationModule con servicios existentes
- **Estimación**: 4 horas
- **Prioridad**: Alta

**Descripción:**
Integrar el módulo de Stock con los servicios existentes de RF-001.

**Criterios de Aceptación:**
- [ ] Importar StockIntegrationModule en app.module.ts
- [ ] Integrar con ShippingService
- [ ] Integrar con CostCalculationService
- [ ] Integrar con TransportMethodsService
- [ ] Actualizar DTOs existentes si es necesario
- [ ] Verificar que no se rompan tests existentes
- [ ] Crear tests de integración end-to-end

**Entregables:**
- Integración completa funcionando
- Tests de integración
- Documentación de cambios

---

#### **Task 6.2: Configurar Variables de Entorno de Producción**
- **ID**: TASK-020
- **Título**: Configurar variables de entorno para producción
- **Estimación**: 2 horas
- **Prioridad**: Media

**Descripción:**
Configurar todas las variables de entorno necesarias para producción.

**Criterios de Aceptación:**
- [ ] Configurar URLs de producción de Stock API
- [ ] Configurar URLs de producción de Keycloak
- [ ] Configurar conexión a Redis de producción
- [ ] Configurar timeouts de producción
- [ ] Configurar umbrales de circuit breaker
- [ ] Documentar configuración de producción
- [ ] Crear scripts de validación

**Entregables:**
- Configuración de producción
- Scripts de validación
- Documentación

---

#### **Task 6.3: Documentación Completa**
- **ID**: TASK-021
- **Título**: Crear documentación completa del módulo
- **Estimación**: 4 horas
- **Prioridad**: Media

**Descripción:**
Crear documentación completa del módulo de integración con Stock.

**Criterios de Aceptación:**
- [ ] Actualizar README principal
- [ ] Crear README específico del módulo
- [ ] Documentar configuración
- [ ] Documentar casos de uso
- [ ] Crear guías de troubleshooting
- [ ] Documentar API endpoints
- [ ] Crear ejemplos de uso
- [ ] Documentar métricas y monitoreo

**Entregables:**
- Documentación completa
- Guías de uso
- Ejemplos de código

---

## 📊 **Resumen de Tasks**

### **Por Fase:**
- **Fase 1**: 5 tasks (12 horas)
- **Fase 2**: 3 tasks (18 horas)
- **Fase 3**: 3 tasks (8 horas)
- **Fase 4**: 3 tasks (12 horas)
- **Fase 5**: 4 tasks (21 horas)
- **Fase 6**: 3 tasks (10 horas)

### **Total:**
- **21 tasks**
- **81 horas** (aproximadamente 10 días hábiles)
- **Prioridad Alta**: 12 tasks
- **Prioridad Media**: 9 tasks

### **Por Tipo:**
- **Implementación**: 12 tasks
- **Testing**: 4 tasks
- **Configuración**: 3 tasks
- **Documentación**: 2 tasks

## 🎯 **Criterios de Éxito**

### **Por Task:**
- [ ] Todos los criterios de aceptación cumplidos
- [ ] Tests unitarios con cobertura > 90%
- [ ] Documentación actualizada
- [ ] Code review aprobado

### **Por Fase:**
- [ ] Todos los tasks de la fase completados
- [ ] Integración entre servicios funcionando
- [ ] Tests de integración pasando
- [ ] Documentación de la fase completa

### **Global:**
- [ ] Módulo completamente funcional
- [ ] Integración con Stock API operativa
- [ ] Circuit breaker funcionando
- [ ] Caché Redis operativo
- [ ] Autenticación JWT configurada
- [ ] Tests completos pasando
- [ ] Documentación completa
- [ ] Performance dentro de objetivos

---

**Nota**: Cada task debe ser completado y revisado antes de pasar al siguiente. Los tests deben pasar en cada iteración.
