📋 REQUISITOS FUNCIONALES Y NO FUNCIONALES - PROYECTO LOGÍSTICA
🎯 DISTRIBUCIÓN DE PUNTAJE (145 pts total)
🔴 CRÍTICO (90 pts - 62%)
Arquitectura: 20 pts → Separación de responsabilidades, patrones, diseño
Lógica de Negocios: 20 pts → Validaciones, reglas de cálculo, transiciones de estado
Acceso a Datos: 20 pts → BD + Prisma ORM + migraciones
Presentación: 25 pts → SvelteKit + UX + Estilos
Cumplimiento Funcional: 15 pts → Features del escenario
🟡 IMPORTANTE (25 pts - 17%)
Exposición de Servicios: 15 pts → API REST bien diseñada
Integración externa: 10 pts → Comunicación con Portal y Stock
🟢 COMPLEMENTARIO (30 pts - 21%)
Escalabilidad: 10 pts → Arquitectura preparada para crecer
Validación de Datos: 5 pts → DTOs, pipes, guards
Estilos: 5 pts → Consistencia visual





GESTIÓN DEL REPOSITORIO
📂 Estructura del Proyecto
logisticaG12/  (MONOREPO - UN SOLO REPOSITORIO)
│
├── backend/                    # Backend trabaja aquí
│   ├── src/
│   │   ├── shipping/          # Envíos
│   │   ├── config/            # Configuración
│   │   ├── vehicles/          # Vehículos
│   │   ├── routes/            # Rutas
│   │   └── integrations/      # Cliente Stock
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos
│   │   └── migrations/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Frontend + Middleware trabajan aquí
│   ├── src/
│   │   ├── routes/            # Frontend: Páginas
│   │   │   ├── dashboard/
│   │   │   ├── shipments/
│   │   │   ├── config/
│   │   │   └── track/
│   │   └── lib/
│   │       ├── components/    # Frontend: Componentes UI
│   │       └── middleware/    # ← MIDDLEWARE TRABAJA AQUÍ
│   │           ├── services/  # API calls al backend
│   │           ├── stores/    # Estado global (Svelte stores)
│   │           ├── mappers/   # Transformadores DTO ↔ UI
│   │           ├── validators/# Validaciones cliente
│   │           ├── errors/    # Manejo de errores
│   │           └── utils/     # Utilidades (polling, format, etc)
│   ├── Dockerfile
│   └── package.json
│
├── docs/                       # DevOps/Docs trabaja aquí
│   ├── architecture/
│   ├── api/
│   ├── database/
│   └── deployment/
│
├── .github/
│   └── workflows/              # DevOps: CI/CD
│
├── docker-compose.yml          # DevOps 
├── README.md
└── CONTRIBUTING.md
Estrategia de Branches
Branches Permanentes (NO SE BORRAN)
main        → Producción (código estable, protegida)
develop     → Integración continua (donde se mergea todo)
Branches Temporales (SE CREAN Y SE BORRAN)
feature/<scope>-<descripcion>    # Nueva funcionalidad → feature/backend-CRUDshipments
fix/<scope>-<descripcion>        # Corrección de bug → fix/backend-CRUDshipments
chore/<descripcion>              # Tareas de mantenimiento
docs/<tema>                      # Documentación



📅 SPRINT 0: PRE-DESARROLLO (Ya completado ✅)
Entregables Actuales:
OpenAPI definida y documentada
API básica con datos mock desplegada
Servidor Oracle Cloud configurado y funcionando
Repositorio GitHub creado
Estructura de carpetas inicial

📅 SPRINT 1: FUNDACIÓN ARQUITECTÓNICA (Semana 1)
Objetivo: Establecer base sólida con servicios core + integración básica
 Puntaje objetivo: Arquitectura (15 pts) + Acceso Datos (15 pts)

🏗️ BACKEND (2 personas)
RF-001: Servicio de Configuración Base [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Backend Team
Descripción: Módulo para gestionar toda la configuración operativa de la plataforma (tipos de transporte, zonas de cobertura, tarifas).
Criterios de Aceptación:
Configuración mediante variables de entorno por ambiente
Almacenamiento de configuración en base de datos PostgreSQL
Gestión de tipos de transporte con velocidades promedio y tarifas base
Gestión de zonas de cobertura con códigos postales argentinos
Factor volumétrico configurable
Endpoints REST para consultar y modificar configuración
Seed data inicial con 4 tipos de transporte y 10 zonas de Argentina
Endpoints:
GET /config/transport-methods → Lista métodos de transporte
POST /config/transport-methods → Crea nuevo método
PATCH /config/transport-methods/{id} → Actualiza método
GET /config/coverage-zones → Lista zonas de cobertura
POST /config/coverage-zones → Crea nueva zona
Impacta: Arquitectura (5 pts), Acceso Datos (5 pts)

RF-002: Integración con Stock (Cliente HTTP) [CRÍTICO]
Prioridad: P0
 Complejidad: Alta
 Responsable: Backend Team
Descripción: Cliente robusto para consumir la API de Stock con manejo de errores, reintentos y circuit breaker.
Criterios de Aceptación:
Implementación con cliente HTTP nativo de NestJS
Reintentos automáticos con backoff exponencial (3 intentos: 1s, 2s, 4s)
Circuit breaker que abre tras 5 fallos consecutivos
Timeout de 2 segundos por request
Fallback a valores por defecto si Stock no responde
Caché de respuestas en Redis con TTL de 10 minutos
Funciones principales:
Consultar datos de producto (peso, dimensiones, depósito)
Validar existencia de reserva
Tests con mocks simulando respuestas de Stock
Impacta: Integración (5 pts), Escalabilidad (3 pts), Arquitectura (2 pts)

RF-003: Servicio de Cotización [CRÍTICO]
Prioridad: P0
 Complejidad: Alta
 Responsable: Backend Team
Descripción: Lógica de cálculo de costos de envío consultando Stock y aplicando reglas de negocio.
Criterios de Aceptación:
Endpoint POST /shipping/cost según OpenAPI
Por cada producto: consultar peso, dimensiones y depósito a Stock
Cálculo de peso volumétrico usando factor configurable
Cálculo de peso facturable (máximo entre peso real y volumétrico)
Cálculo de distancia entre depósito y destino
Aplicación de tarifas: base + (peso × tarifa/kg) + (distancia × tarifa/km)
Validación de zona de cobertura antes de cotizar
Respuesta en menos de 3 segundos
Uso de caché de productos para reducir llamadas a Stock
Flag "estimated" si se usan valores por defecto por timeout de Stock
Impacta: Lógica de Negocios (8 pts), Cumplimiento Funcional (5 pts), Integración (2 pts)

RF-004: Esquema de Base de Datos con Prisma [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Backend Team
Descripción: Diseño completo del modelo de datos con Prisma ORM incluyendo todas las entidades necesarias.
Criterios de Aceptación:
Schema Prisma con todos los modelos:
TransportMethod (tipos de transporte)
CoverageZone (zonas de cobertura)
Shipment (envíos)
ShipmentProduct (productos por envío)
ShipmentLog (historial de estados)
Vehicle (vehículos)
Driver (conductores)
Route (rutas)
RouteStop (paradas de ruta)
Relaciones bien definidas (1:N, N:M)
Enums para estados y tipos
Índices en campos de búsqueda frecuente
Constraints de unicidad y validación
Migraciones generadas y documentadas
Script de seed con datos iniciales
Impacta: Acceso Datos (10 pts), Arquitectura (3 pts)

🎨 FRONTEND (2 personas)
RF-005: Layout y Estructura Base del Dashboard [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Frontend Team
Descripción: Estructura principal de la aplicación con navegación, layout responsive y componentes base reutilizables.
Criterios de Aceptación:
Layout principal con header, sidebar y área de contenido
Navbar con logo y menú principal
Sidebar colapsable con navegación por secciones
Diseño responsive (mobile, tablet, desktop)
Componentes base reutilizables:
DataTable genérico
FormField con validación visual
Modal/Dialog
Button con variantes
Card contenedor
Badge para estados
Sistema de notificaciones toast
Manejo de estados de carga global
Configuración inicial de Tailwind CSS
Impacta: Presentación (8 pts), Usabilidad (3 pts), MVC (2 pts)

RF-006: Páginas de Configuración [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Frontend Team
Descripción: Interfaces administrativas para configurar tipos de transporte y zonas de cobertura.
Criterios de Aceptación:
Página: Gestión de Tipos de Transporte
Tabla mostrando tipo, nombre, velocidad, días estimados, tarifas y estado
Formulario modal para crear/editar
Validación de campos obligatorios y formato de números
Toggle para activar/desactivar tipos
Confirmación antes de acciones destructivas
Página: Gestión de Zonas de Cobertura
Lista de zonas con códigos postales asociados
Formulario para agregar zona con input de CPs separados por comas
Validación de formato de CP argentino
Búsqueda y filtrado de zonas
Loading states durante operaciones
Mensajes de error descriptivos
Confirmación de acciones exitosas
Impacta: Presentación (5 pts), Usabilidad (3 pts)

🔗 MIDDLEWARE (3 personas)
RF-007: Servicios HTTP (API Client Layer) [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Middleware Team
Descripción: Capa de servicios que encapsula todas las llamadas HTTP al backend, manejo de autenticación y errores.
Criterios de Aceptación:
Cliente HTTP base con configuración centralizada
Inyección automática del token JWT en headers
Manejo unificado de errores HTTP
Timeout configurable por request
Servicios específicos por dominio:
ConfigService (transport methods, coverage zones)
ShipmentService (cotización, CRUD envíos)
VehicleService (CRUD vehículos)
DriverService (CRUD conductores)
RouteService (planificación)
ReportService (KPIs y analytics)
Tipado fuerte con TypeScript/interfaces
Retry logic para requests idempotentes
Logging de requests para debugging
Impacta: Arquitectura (5 pts), Exposición Servicios (3 pts)

RF-008: Stores de Estado Global (Svelte Stores) [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: Middleware Team
Descripción: Sistema de gestión de estado global usando Svelte stores para compartir datos entre componentes.
Criterios de Aceptación:
Stores principales:
authStore (usuario, token, permisos)
shipmentsStore (lista de envíos con filtros)
configStore (métodos transporte, zonas)
vehiclesStore (flota de vehículos)
driversStore (lista de conductores)
uiStore (modales, notificaciones, loading states)
Métodos de actualización reactivos
Persistencia de auth en localStorage
Sincronización automática con backend
Funciones helper para operaciones comunes
Derived stores para datos computados
Impacta: Arquitectura (3 pts), Presentación (2 pts)

RF-009: Validadores y Transformadores [IMPORTANTE]
Prioridad: P1
 Complejidad: Baja
 Responsable: Middleware Team
Descripción: Schemas de validación para formularios y transformadores de datos entre formatos de backend y UI.
Criterios de Aceptación:
Schemas de validación con Zod:
CreateShipmentSchema
AddressSchema
VehicleSchema
RouteSchema
ConfigSchema
Validaciones customizadas (CP argentino, números positivos, etc.)
Mensajes de error en español
Mappers bidireccionales:
DTO → ViewModel (backend → frontend)
FormData → DTO (frontend → backend)
Utilidades de transformación:
Formateo de fechas
Formateo de moneda
Traducción de estados
Formateo de direcciones
Impacta: Validación de Datos (5 pts), Usabilidad (2 pts)

📚 DEVOPS/DOCS (3 personas)
RF-010: Infraestructura Docker + CI/CD Base [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: DevOps Team
Descripción: Contenedorización completa con Docker Compose y pipeline básico de CI/CD.
Criterios de Aceptación:
Docker Compose con servicios:
PostgreSQL
Redis
Backend (NestJS)
Frontend (SvelteKit)
Dockerfiles optimizados con multi-stage builds
Variables de entorno documentadas en .env.example
Scripts npm para operaciones comunes (build, up, down, logs)
GitHub Actions workflow básico:
Trigger en push a develop y main
Lint del código
Ejecución de tests
Build de imágenes
Deploy a Oracle Cloud (solo en main)
README con instrucciones de setup local
Documentación de comandos útiles
Impacta: Escalabilidad (4 pts), Arquitectura (3 pts)

✅ ENTREGABLE SPRINT 1:
✅ Base de datos diseñada y migrada
✅ API de cotización funcionando
✅ Cliente de Stock con circuit breaker
✅ Frontend con layout y configuración base
✅ Servicios HTTP y stores implementados
✅ Docker Compose funcional
✅ CI/CD básico en GitHub Actions
Puntaje acumulado: ~45/145 pts

📅 SPRINT 2: CREACIÓN Y GESTIÓN DE ENVÍOS (Semana 2)
Objetivo: Implementar flujo completo de creación y gestión de envíos
 Puntaje objetivo: Lógica de Negocios (10 pts) + Cumplimiento Funcional (10 pts)

🏗️ BACKEND (2 personas)
RF-011: Servicio de Gestión de Envíos (CRUD Completo) [CRÍTICO]
Prioridad: P0
 Complejidad: Alta
 Responsable: Backend Team
Descripción: Implementación completa del ciclo de vida de envíos con máquina de estados.
Criterios de Aceptación:
Endpoint POST /shipping (crear envío):
Validar zona de cobertura del destino
Consultar productos a Stock (peso, dimensiones, depósito)
Validar reserva activa en Stock
Calcular costo final de envío
Generar shipping_id único autoincremental
Crear registro con estado inicial "created"
Crear log inicial en ShipmentLog
Todo en transacción atómica (Prisma)
Calcular ETA inicial
Endpoint GET /shipping/{id} (detalle):
Devolver envío completo con productos
Incluir historial completo de logs
Incluir direcciones y tracking info
Respuesta en menos de 500ms (con caché Redis)
Endpoint GET /shipping (lista con filtros):
Filtros: user_id, status, from_date, to_date
Paginación: page, limit (default 20, max 100)
Ordenamiento por created_at DESC
Respuesta con metadata de paginación
Máquina de estados con transiciones válidas definidas
Tests unitarios de servicios
Tests de integración de endpoints
Impacta: Lógica de Negocios (8 pts), Cumplimiento Funcional (7 pts), Acceso Datos (3 pts)

RF-012: Cancelación de Envíos [IMPORTANTE]
Prioridad: P1
 Complejidad: Baja
 Responsable: Backend Team
Descripción: Endpoint para cancelar envíos con validaciones de estado según reglas de negocio.
Criterios de Aceptación:
Endpoint POST /shipping/{id}/cancel:
Validar que estado actual sea "created" o "reserved"
Rechazar cancelación si estado >= "in_transit" (error 400)
Actualizar estado a "cancelled"
Registrar timestamp de cancelación
Crear log de cancelación con motivo
NO liberar reserva en Stock (responsabilidad de Portal)
Response con envío actualizado
Manejo de errores específicos
Tests de casos exitosos y fallidos
Impacta: Lógica de Negocios (3 pts), Cumplimiento Funcional (2 pts)

🎨 FRONTEND (2 personas)
RF-013: Dashboard de Gestión de Envíos [CRÍTICO]
Prioridad: P0
 Complejidad: Alta
 Responsable: Frontend Team
Descripción: Interfaz completa para visualizar, filtrar y gestionar envíos.
Criterios de Aceptación:
Página: Lista de Envíos
Tabla con columnas: ID, Orden, Usuario, Estado, Tipo Transporte, ETA, Fecha
Sistema de filtros:
Por estado (multi-select dropdown)
Por rango de fechas (date picker)
Por usuario (search input)
Paginación funcional con navegación
Badges de color por estado
Ordenamiento clickeable por columnas
Click en fila navega a detalle
Botón para limpiar filtros
Contador de resultados
Página: Detalle de Envío
Header con shipping_id destacado
Estado actual con badge de color
Información general (orden, usuario, transporte, costo)
Dirección de entrega completa
Dirección de origen
Tabla de productos con cantidades
Timeline visual de estados (componente tipo stepper)
Botón "Cancelar Envío" (visible solo si estado lo permite)
Modal de confirmación antes de cancelar
Loading states y skeletons
Manejo de errores con mensajes claros
Breadcrumbs de navegación
Impacta: Presentación (10 pts), Usabilidad (5 pts), MVC (2 pts)

🔗 MIDDLEWARE (3 personas)
RF-014: Manejo Global de Errores [IMPORTANTE]
Prioridad: P1
 Complejidad: Baja
 Responsable: Middleware Team
Descripción: Sistema centralizado para capturar, procesar y mostrar errores de forma amigable.
Criterios de Aceptación:
Interceptor global de errores HTTP
Clasificación de errores por código de status
Mensajes personalizados por tipo de error
Toast notifications para errores
Logging de errores en consola (desarrollo)
Manejo de errores de red (offline)
Manejo de timeout
Traducción de errores técnicos a lenguaje de usuario
Redirección automática en caso de 401 (sin sesión)
Funciones helper para mostrar errores específicos
Impacta: Usabilidad (3 pts), Arquitectura (2 pts)

RF-015: Sistema de Polling [COMPLEMENTARIO]
Prioridad: P2
 Complejidad: Baja
 Responsable: Middleware Team
Descripción: Utilidad para actualizar datos automáticamente mediante polling periódico.
Criterios de Aceptación:
Clase PollingService reutilizable
Configuración de intervalo personalizado
Auto-limpieza al desmontar componentes
Pausar polling cuando tab está inactivo
Reanudar al volver a tab
Stop manual del polling
Uso en página de tracking para actualizar estados
Impacta: Usabilidad (2 pts)

📚 DEVOPS/DOCS (3 personas)
RF-016: Documentación de APIs y Arquitectura Inicial [IMPORTANTE]
Prioridad: P1
 Complejidad: Baja
 Responsable: DevOps Team
Descripción: Documentación técnica de las APIs implementadas y decisiones arquitectónicas tomadas.
Criterios de Aceptación:
Swagger UI configurado en /api/docs
OpenAPI spec sincronizada con implementación
Ejemplos de requests/responses en documentación
docs/ARCHITECTURE.md con:
Diagrama C4 nivel 2 (contexto y contenedores)
Stack tecnológico usado
Decisiones arquitectónicas principales (ADRs)
Justificación de tecnologías elegidas
docs/API.md con guía de uso de endpoints
Documentación de variables de entorno
Impacta: Documentación técnica requerida

✅ ENTREGABLE SPRINT 2:
✅ CRUD completo de envíos funcionando
✅ Cancelación de envíos operativa
✅ Dashboard de gestión de envíos
✅ Sistema de filtrado y paginación
✅ Manejo robusto de errores
✅ Documentación inicial
Puntaje acumulado: ~75/145 pts

📅 SPRINT 3: TRACKING Y ESTADOS (Semana 3)
Objetivo: Sistema de seguimiento y actualización de estados
 Puntaje objetivo: Cumplimiento Funcional (8 pts) + Lógica de Negocios (5 pts)

🏗️ BACKEND (2 personas)
RF-017: Actualización de Estados [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Backend Team
Descripción: Sistema para transicionar estados de envíos validando reglas de la máquina de estados.
Criterios de Aceptación:
Endpoint PATCH /shipping/{id}/status:
Body: { status, message (opcional) }
Validar transición permitida según máquina de estados
Rechazar transiciones inválidas con error 400 descriptivo
Actualizar estado y timestamp
Crear registro en ShipmentLog automáticamente
Recalcular ETA según nuevo estado:
in_transit: ETA = NOW() + (distancia/velocidad) + buffer
arrived: ETA = NOW() + 1 día
in_distribution: ETA = NOW() + 4 horas
Invalidar caché de ese envío
Tests de todas las transiciones válidas e inválidas
Documentación de flujo de estados
Impacta: Lógica de Negocios (5 pts), Cumplimiento Funcional (4 pts)

RF-018: Generación de Etiquetas PDF [COMPLEMENTARIO]
Prioridad: P2
 Complejidad: Media
 Responsable: Backend Team
Descripción: Generación automática de etiquetas de envío en formato PDF con código de barras.
Criterios de Aceptación:
Endpoint GET /shipping/{id}/label:
Genera PDF con librería (pdfkit o puppeteer)
Incluye código de barras del shipping_id
Muestra dirección de origen y destino
Muestra tipo de transporte
Logo de la empresa (mock)
Almacena PDF en filesystem o storage
Devuelve URL pública del archivo
Generación async con queue (BullMQ + Redis)
Campo labelUrl en modelo Shipment
Regeneración si se solicita nuevamente
Tests de generación
Impacta: Cumplimiento Funcional (2 pts)

🎨 FRONTEND (2 personas)
RF-019: Página de Tracking Público [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: Frontend Team
Descripción: Página pública (sin autenticación) para que clientes consulten el estado de su envío.
Criterios de Aceptación:
Ruta pública: /track/{shipping_id}
Input de búsqueda por shipping_id
Timeline visual de estados con íconos:
Estados completados: verde con checkmark
Estado actual: azul con spinner animado
Estados pendientes: gris
Información mostrada:
Estado actual y descripción
ETA estimado
Dirección de entrega (parcial por privacidad)
Tipo de transporte
Tracking number si existe
Polling automático cada 30 segundos
Botón para descargar etiqueta si está disponible
Diseño mobile-first responsive
Manejo de envío no encontrado
Loading state durante búsqueda
Impacta: Presentación (5 pts), Usabilidad (4 pts)

🔗 MIDDLEWARE (3 personas)
RF-020: Optimización de Performance (Caché Cliente) [COMPLEMENTARIO]
Prioridad: P2
 Complejidad: Baja
 Responsable: Middleware Team
Descripción: Sistema de caché en el cliente para reducir requests innecesarios.
Criterios de Aceptación:
Caché en memoria para listas consultadas recientemente
TTL configurable por tipo de dato
Invalidación manual cuando hay cambios
Deduplicación de requests simultáneos
Caché de configuración estática (transport methods, zones)
Bypass de caché con flag force_refresh
Impacta: Escalabilidad (2 pts)

📚 DEVOPS/DOCS (3 personas)
RF-021: Tests Unitarios Backend [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: DevOps Team (con Backend)
Descripción: Suite de tests unitarios para servicios críticos del backend.
Criterios de Aceptación:
Tests con Jest para:
Servicio de cotización (cálculos)
Servicio de envíos (CRUD y estados)
Cliente de Stock (mocks)
Validaciones de negocio
Cobertura mínima: 60% en servicios críticos
Mocks de dependencias externas
Tests de casos edge
Ejecución en CI/CD
Badge de cobertura en README
Impacta: Arquitectura (3 pts), Escalabilidad (2 pts)

✅ ENTREGABLE SPRINT 3:
✅ Sistema de actualización de estados
✅ Recálculo automático de ETAs
✅ Generación de etiquetas PDF
✅ Página pública de tracking
✅ Tests unitarios implementados
Puntaje acumulado: ~95/145 pts

📅 SPRINT 4: PLANIFICACIÓN Y RUTAS (Semana 4)
Objetivo: Gestión de flota y planificación de rutas
 Puntaje objetivo: Lógica de Negocios (5 pts) + Presentación (8 pts)

🏗️ BACKEND (2 personas)
RF-022: Gestión de Vehículos y Conductores [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: Backend Team
Descripción: CRUD completo para administrar la flota de vehículos y conductores.
Criterios de Aceptación:
Vehículos:
GET /vehicles → lista con filtros
POST /vehicles → crear vehículo
PATCH /vehicles/{id} → editar
DELETE /vehicles/{id} → soft delete (cambiar estado a inactivo)
Campos: patente, tipo, capacidad peso, capacidad volumen, estado
Validación de patente única
Estados: active, maintenance, inactive
Conductores:
GET /drivers → lista con filtros
POST /drivers → crear conductor
PATCH /drivers/{id} → editar
DELETE /drivers/{id} → soft delete
Campos: nombre, email, teléfono, licencia, estado
Validación de email y licencia únicos
Estados: available, on_route, off_duty
Tests de CRUD completo
Impacta: Acceso Datos (3 pts), Cumplimiento Funcional (2 pts)

RF-023: Planificación de Rutas [IMPORTANTE]
Prioridad: P1
 Complejidad: Alta
 Responsable: Backend Team
Descripción: Sistema para asignar envíos a rutas validando capacidades y optimizando secuencias.
Criterios de Aceptación:
Endpoint GET /routes/pending-shipments:
Lista envíos con estado "picked_up" listos para asignar
Agrupados por zona
Muestra peso y volumen total
Endpoint POST /routes:
Body: vehicleId, driverId, date, shipmentIds[]
Validar capacidad del vehículo:
Calcular suma de pesos de todos los envíos
Calcular suma de volúmenes
Si excede 90%: warning en response pero permite
Si excede 100%: rechazar con error 422
Crear ruta con RouteStops ordenados
Optimización básica de secuencia por proximidad de CPs
Algoritmo greedy: nearest neighbor
Cambiar estado de envíos a "reserved"
Endpoint GET /routes/{id}:
Detalle de ruta con paradas ordenadas
Información de vehículo y conductor
Capacidad utilizada vs disponible
Tests de validación de capacidad
Impacta: Lógica de Negocios (5 pts), Cumplimiento Funcional (3 pts)

🎨 FRONTEND (2 personas)
RF-024: Dashboard de Planificación de Rutas [CRÍTICO]
Prioridad: P0
 Complejidad: Alta
 Responsable: Frontend Team
Descripción: Interfaz visual con drag & drop para asignar envíos a rutas de forma intuitiva.
Criterios de Aceptación:
Vista Principal de Planificación:
Layout de dos paneles:
Panel izquierdo: lista de envíos pendientes
Panel derecho: rutas del día seleccionado
Date picker para seleccionar fecha
Contador de envíos pendientes vs asignados
Drag & Drop:
Arrastrar envío desde lista pendientes a ruta
Validación en tiempo real de capacidad
Indicador visual de capacidad:
Verde: <90%
Amarillo: 90-100%
Rojo: >100% (bloquea confirmación)
Animaciones suaves de arrastre
Feedback visual al soltar
Formulario de Nueva Ruta:
Select de vehículo (muestra capacidad disponible)
Select de conductor (solo disponibles)
Date picker para fecha de ruta
Vista previa de capacidad inicial
Vista de Ruta:
Lista ordenada de paradas con drag para reordenar
Muestra peso y volumen acumulado
Barra de progreso de capacidad con colores
Botón "Optimizar Secuencia" (llama a backend)
Botón "Confirmar Ruta"
Información de cada parada: dirección, CP, productos
Mapa estático mostrando puntos de paradas
Confirmación antes de eliminar ruta
Impacta: Presentación (8 pts), Usabilidad (5 pts), MVC (3 pts)

RF-025: Gestión de Flota (UI) [COMPLEMENTARIO]
Prioridad: P2
 Complejidad: Baja
 Responsable: Frontend Team
Descripción: Páginas para administrar vehículos y conductores.
Criterios de Aceptación:
Página: Vehículos
Tabla con: Patente, Tipo, Capacidad, Estado
Formulario modal para crear/editar
Badges de estado con colores
Filtro por tipo y estado
Página: Conductores
Tabla con: Nombre, Email, Teléfono, Licencia, Estado
Formulario modal para crear/editar
Filtro por estado
Impacta: Presentación (2 pts)

🔗 MIDDLEWARE (3 personas)
RF-026: Drag & Drop Logic [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: Middleware Team
Descripción: Lógica para manejar el drag & drop de envíos a rutas con validaciones.
Criterios de Aceptación:
Funciones helper para drag & drop
Validación de capacidad antes de soltar
Cálculo de peso/volumen acumulado
Actualización de stores al mover items
Animaciones y feedback visual
Funciones para reordenar paradas
Persistencia de cambios al backend
Impacta: Presentación (2 pts), Arquitectura (1 pt)

📚 DEVOPS/DOCS (3 personas)
RF-027: Tests E2E Frontend [COMPLEMENTARIO]
Prioridad: P2
 Complejidad: Media
 Responsable: DevOps Team (con Frontend)
Descripción: Tests end-to-end de flujos críticos de usuario.
Criterios de Aceptación:
Tests con Playwright para:
Flujo de consulta de cotización
Flujo de visualización de envío
Flujo de cancelación de envío
Flujo de planificación de ruta
Ejecución en CI/CD
Screenshots en caso de fallo
Impacta: Arquitectura (2 pts)

✅ ENTREGABLE SPRINT 4:
✅ CRUD de vehículos y conductores
✅ Sistema de planificación de rutas
✅ Dashboard con drag & drop funcional
✅ Optimización básica de rutas
✅ Tests E2E básicos
Puntaje acumulado: ~120/145 pts

📅 SPRINT 5: REFINAMIENTO E INTEGRACIÓN (Semana 5)
Objetivo: Integración final, optimización y reportes
 Puntaje objetivo: Integración (5 pts) + Escalabilidad (5 pts)

🏗️ BACKEND (2 personas)
RF-028: Integración Completa con Portal [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Backend Team + Middleware Team
Descripción: Verificación end-to-end de integración con el Portal de Compras.
Criterios de Aceptación:
Validación de todos los endpoints de la OpenAPI pública
Contract testing con datos reales del Portal
Flujo completo simulado:
Portal solicita cotización
Portal crea envío
Portal consulta tracking
Portal cancela envío
Documentación de payloads exactos esperados
Manejo de casos edge
Logs detallados de integraciones
Impacta: Integración (5 pts), Exposición Servicios (2 pts)

RF-029: Optimización de Performance [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: Backend Team
Descripción: Implementación de caché avanzado y optimizaciones de queries.
Criterios de Aceptación:
Caché Redis de:
Métodos de transporte (TTL 1 hora)
Productos de Stock (TTL 10 minutos)
Detalles de envío delivered/cancelled (TTL 30 segundos)
Invalidación automática de caché al actualizar
Optimización de queries Prisma:
Eager loading de relaciones
Índices en campos de búsqueda
Paginación eficiente
Medición de tiempos de respuesta
Cumplimiento de SLAs:
Cotización <3seg
Tracking <500ms
Impacta: Escalabilidad (5 pts), Exposición Servicios (2 pts)

🎨 FRONTEND (2 personas)
RF-030: Dashboard de Reportes y KPIs [IMPORTANTE]
Prioridad: P1
 Complejidad: Media
 Responsable: Frontend Team
Descripción: Dashboard con métricas operativas y visualizaciones.
Criterios de Aceptación:
Página: Dashboard de Métricas
KPI Cards destacados:
Total de envíos (hoy/semana/mes)
Tasa de entrega exitosa (%)
Tiempo promedio de entrega
Envíos por estado
Gráficos con Chart.js o ECharts:
Línea temporal: envíos por día (últimos 30 días)
Pie chart: distribución por tipo de transporte
Bar chart: envíos por estado
Bar chart: top 5 zonas con más envíos
Filtros por rango de fechas
Actualización automática
Endpoint backend: GET /reports/kpis
Export básico a CSV (nice to have)
Impacta: Presentación (5 pts), Usabilidad (2 pts)

🔗 MIDDLEWARE (3 personas)
RF-031: Logging Estructurado [IMPORTANTE]
Prioridad: P1
 Complejidad: Baja
 Responsable: Middleware Team
Descripción: Sistema de logs estructurados para debugging y monitoreo.
Criterios de Aceptación:
Logger configurado en todos los servicios
Formato JSON estructurado
Niveles de log: error, warn, info, debug
Contexto en cada log: timestamp, user_id, action, duration
Logs de:
Requests HTTP (entrada/salida)
Errores capturados
Operaciones críticas
Performance de operaciones lentas
Trace ID para seguir requests entre servicios
Configuración por ambiente (verbose en dev, mínimo en prod)
Impacta: Escalabilidad (3 pts), Arquitectura (2 pts)

📚 DEVOPS/DOCS (3 personas)
RF-032: Monitoreo y Observabilidad Básica [COMPLEMENTARIO]
Prioridad: P2
 Complejidad: Media
 Responsable: DevOps Team
Descripción: Setup básico de herramientas de monitoreo.
Criterios de Aceptación:
Health check endpoints: /health, /ready
Métricas básicas expuestas:
Request count
Response times
Error rate
Dashboard básico con métricas en tiempo real
Alertas configuradas para:
API caída
Error rate >5%
Latencia >3seg
Impacta: Escalabilidad (2 pts)

✅ ENTREGABLE SPRINT 5:
✅ Integración con Portal verificada
✅ Performance optimizado con caché
✅ Dashboard de reportes funcional
✅ Sistema de logging implementado
✅ Monitoreo básico configurado
Puntaje acumulado: ~135/145 pts

📅 SPRINT 6: POLISH Y ENTREGA (Semana 6)
Objetivo: Refinamiento final, documentación completa y demo
 Puntaje objetivo: Completar 145/145 pts

🎨 FRONTEND (2 personas)
RF-033: Polish de UX/UI [CRÍTICO]
Prioridad: P0
 Complejidad: Media
 Responsable: Frontend Team
Descripción: Refinamiento final de experiencia de usuario y diseño.
Criterios de Aceptación:
Design System Consistente:
Paleta de colores definida y aplicada
Tipografía uniforme
Espaciados consistentes con Tailwind
Componentes con estilo coherente
Animaciones y Transiciones:
Transiciones suaves entre páginas
Loading skeletons en lugar de spinners
Hover effects sutiles
Micro-interacciones en botones
Responsive Design:
Funcional en mobile (<640px)
Optimizado para tablet (640-1024px)
Full experience en desktop (>1024px)
Menú hamburguesa en mobile
Accesibilidad Básica:
Labels en todos los formularios
Contraste WCAG AA
Navegación por teclado funcional
Alt text en imágenes
Estados de Carga:
Feedback visual en todas las operaciones
Deshabilitar botones durante operaciones
Mensajes de confirmación claros
Impacta: Presentación (5 pts), Estilos (5 pts), Usabilidad (3 pts)

📚 DEVOPS/DOCS (3 personas)
RF-034: Documentación Técnica Completa [CRÍTICO]
Prioridad: P0
 Complejidad: Baja
 Responsable: DevOps Team (con todos)
Descripción: Documentación exhaustiva para evaluación.
Entregables:
README.md principal:
Descripción del proyecto
Features implementadas
Stack tecnológico completo
Instrucciones de setup local paso a paso
Scripts disponibles
Variables de entorno documentadas
URLs de acceso (dev y prod)
Troubleshooting común
docs/ARCHITECTURE.md:
Diagrama C4 nivel 2 y 3
Decisiones arquitectónicas (ADRs)
Patrones de diseño utilizados
Justificación de tecnologías
Trade-offs considerados
docs/DEPLOYMENT.md:
Diagrama de deployment
Infraestructura Docker Compose
CI/CD pipeline explicado
Proceso de deploy a Oracle Cloud
Rollback strategy
docs/API.md:
OpenAPI spec actualizada
Guía de uso de endpoints
Ejemplos de requests/responses
Códigos de error
Rate limiting
docs/DATABASE.md:
Diagrama ER
Descripción de tablas y relaciones
Migraciones aplicadas
Seed data
Diagramas UML:
Diagrama de clases (entidades principales)
Diagrama de secuencia (flujo de cotización)
Diagrama de secuencia (flujo de creación de envío)
Diagrama de estados (ciclo de vida del envío)
Impacta: Arquitectura (5 pts), Requisito de evaluación

RF-035: Video Demo y Presentación [CRÍTICO]
Prioridad: P0
 Complejidad: Baja
 Responsable: Todo el equipo
Descripción: Material audiovisual para presentación final.
Entregables:
Video Demo (10-15 minutos):
Introducción del problema
Arquitectura implementada
Flujo completo demostrado:
Cotización de envío
Creación de envío
Tracking en tiempo real
Planificación de rutas
Dashboard de configuración
Dashboard de reportes
Snippets de código relevante
Integración con Portal y Stock
Desafíos superados
Presentación (slides):
Problema a resolver
Solución propuesta
Arquitectura general
Stack tecnológico
Features implementadas
Decisiones técnicas clave
Aprendizajes del equipo
Próximos pasos (mejoras futuras)
Q&A preparado
Impacta: Evaluación final

RF-036: Deploy Final y Verificación [CRÍTICO]
Prioridad: P0
 Complejidad: Baja
 Responsable: DevOps Team
Descripción: Deploy a producción y verificación de funcionamiento.
Criterios de Aceptación:
Deploy exitoso en Oracle Cloud
URL pública accesible
Todos los servicios funcionando
Base de datos con seed data
Variables de entorno configuradas
HTTPS configurado (si posible)
Health checks respondiendo
CI/CD funcionando correctamente
Rollback testeado
Documentación de accesos
Impacta: Requisito de entrega

✅ ENTREGABLE SPRINT 6 (ENTREGA FINAL):
✅ UI pulida y responsive
✅ Documentación técnica completa
✅ Diagramas UML
✅ Video demo producido
✅ Presentación preparada
✅ Deploy en producción verificado
✅ README con instrucciones claras
✅ Código limpio y comentado
Puntaje final: 145/145 pts

📊 REQUISITOS NO FUNCIONALES
RNF-001: Performance [CRÍTICO]
Cotización de envío: <3 segundos (95th percentile)
API de tracking: <500ms (99th percentile)
Dashboard: First Contentful Paint <2 segundos
Carga de lista de envíos: <1 segundo con 1000 registros
RNF-002: Disponibilidad [IMPORTANTE]
Uptime objetivo: 99% durante la evaluación
Graceful degradation si Stock no responde
RNF-003: Seguridad [CRÍTICO]
JWT con expiración de 24 horas
Contraseñas hasheadas con bcrypt (cost 12)
SQL injection prevención vía Prisma
Rate limiting: 1000 req/min por IP
HTTPS en producción (si Oracle lo permite)
RNF-004: Escalabilidad [MEDIO]
Arquitectura stateless horizontal-scalable
Connection pooling de base de datos
Caché distribuido con Redis
Soportar 100 envíos concurrentes
RNF-005: Mantenibilidad [CRÍTICO]
Cobertura de tests: >60% en código crítico
Linter configurado (ESLint + Prettier)
Conventional commits en todo el proyecto
Code review obligatorio en PRs
Logs estructurados en JSON
RNF-006: Usabilidad [CRÍTICO]
Responsive design (mobile, tablet, desktop)
Loading states en todas las operaciones async
Mensajes de error en español
Confirmación antes de acciones destructivas
Feedback visual inmediato

🎯 CHECKLIST DE ENTREGA FINAL
Código:
Repositorio público en GitHub
README completo con instrucciones
Todos los servicios en Docker Compose
Tests pasando (>60% cobertura)
Linter sin errores
Variables de entorno documentadas
.gitignore configurado correctamente
Deploy:
Aplicación corriendo en Oracle Cloud
URL pública accesible
CI/CD funcionando
Health checks operativos
Documentación:
Arquitectura explicada con diagramas C4
API documentada con Swagger
Diagramas UML (clases, secuencia, estados)
Decisiones técnicas documentadas (ADRs)
Guía de deployment
Database schema documentado
Demo:
Video de 10-15 minutos
Presentación en slides
Flujo end-to-end demostrado
Código relevante explicado



🚨 RIESGOS Y MITIGACIONES
Riesgo
Impacto
Prob
Mitigación
Stock API no disponible
Alto
Media
Circuit breaker + valores por defecto
Complejidad de rutas
Medio
Alta
Algoritmo simple primero
Tiempo insuficiente
Alto
Media
Priorizar por puntaje
Integración con Portal
Alto
Media
Contract testing desde Sprint 1
Performance
Medio
Baja
Caché Redis + optimización queries


