# Contexto del Proyecto - Módulo de Logística

## 🎯 **Información General del Proyecto**

**Nombre**: Módulo de Transporte, Logística y Seguimiento  
**Grupo**: 12 - UTN FRRE  
**Año**: 2025 - TPI Desarrollo de Software  
**Tipo**: Microservicio de Logística (parte de ecosistema mayor)

## 🏗️ **Arquitectura del Sistema**

### **Ecosistema Completo:**
- **Portal de Compras**: Venta, cobro, gestión de catálogo
- **Stock**: Gestión de inventario y reservas
- **Logística** (este módulo): Transporte y seguimiento

### **Responsabilidades del Módulo de Logística:**
✅ **SÍ HACE:**
- Cotizar costo y tiempo de envío
- Crear y gestionar envíos post-compra
- Planificar retiros en depósitos de Stock
- Coordinar y ejecutar retiros físicos
- Planificar rutas de entrega optimizadas
- Ejecutar entregas con evidencia digital
- Gestionar problemas, reintentos y reprogramaciones
- Procesar cancelaciones (dentro de ventana permitida)
- Gestionar devoluciones a Stock
- Mantener trazabilidad completa
- Generar documentación operativa

❌ **NO HACE:**
- Venta de productos
- Gestión de catálogo
- Cobro de envíos
- Gestión de inventario
- Almacenamiento propio
- Sucursales de retiro
- Notificaciones push al cliente final
- Gestión de reclamos comerciales
- Facturación al cliente

## 🔄 **Flujo Operativo Principal**

### **Estados del Envío:**
```
created → pickup_scheduled → picking_up → picked_up → 
out_for_delivery → delivered ✅

Desvíos:
created → cancelled ❌
pickup_scheduled → cancelled ❌
out_for_delivery → delivery_failed → out_for_delivery (reintento)
delivery_failed → returning → returned ❌
```

### **Flujo Completo:**
1. **Cotización Previa**: Portal solicita costo y ETA
2. **Creación de Envío**: Portal crea envío post-compra
3. **Programación de Retiro**: Asignar vehículo/conductor
4. **Retiro en Depósito**: Conductor retira mercadería
5. **Planificación de Entrega**: Optimizar rutas
6. **Ejecución de Entrega**: Entregar al cliente
7. **Cierre**: Confirmar entrega y generar POD

## 🛠️ **Stack Tecnológico**

### **Backend (NestJS):**
- **Framework**: NestJS con TypeScript
- **Base de datos**: PostgreSQL en Supabase con Prisma ORM (acceso via MCP)
- **Cache**: Redis
- **Documentación**: OpenAPI/Swagger
- **Testing**: Jest

### **Frontend (SvelteKit):**
- **Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Estado**: Svelte Stores
- **Validación**: Zod

### **DevOps:**
- **Contenedores**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deploy**: Oracle Cloud

## 🔗 **Integraciones**

### **APIs que EXPONEMOS:**
```
POST /shipping/cost     → Cotizar envío
POST /shipping          → Crear envío
GET /shipping/{id}      → Consultar estado
POST /shipping/{id}/cancel → Cancelar envío
GET /shipping/{id}/pod  → Obtener POD
```

### **APIs que CONSUMIMOS:**
```
GET /productos/{id}     → Consultar producto (Stock)
GET /reservas/{id}      → Validar reserva (Stock)
```

### **Modelo de Comunicación:**
- **NO hay webhooks** implementados
- Portal hace **polling** consultando GET /shipping/{id}
- Portal se encarga de actualizar su propia base de datos

## 📊 **Reglas de Negocio Críticas**

### **Cotización:**
- Precio = tarifa base + (peso volumétrico × tarifa/kg) + (distancia × tarifa/km)
- Peso volumétrico = MAX(peso real, (largo×ancho×alto)/factor)
- ETA = próximo slot de retiro + tiempo tránsito + buffer operativo
- No cotiza si dirección fuera de zona de cobertura

### **Creación de Envío:**
- Solo se crea si existe reserva activa en Stock
- ETA inicial considera carga operativa actual
- Rechaza si reserva caducó o productos no coinciden
- Devuelve shipping_id único al Portal

### **Cancelación:**
- Permitida SOLO si estado = "created" o "pickup_scheduled"
- No se puede cancelar si estado ≥ "picking_up"
- Portal es responsable de liberar reserva en Stock
- Estado cambia a "cancelled"

## 🏗️ **Estructura del Proyecto**

```
logisticaG12/  (MONOREPO)
│
├── backend/                    # Backend (NestJS)
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
├── frontend/                   # Frontend (SvelteKit)
│   ├── src/
│   │   ├── routes/            # Páginas
│   │   │   ├── dashboard/
│   │   │   ├── shipments/
│   │   │   ├── config/
│   │   │   └── track/
│   │   └── lib/
│   │       ├── components/    # Componentes UI
│   │       └── middleware/    # Capa de servicios
│   │           ├── services/  # API calls al backend
│   │           ├── stores/    # Estado global
│   │           ├── mappers/   # Transformadores DTO ↔ UI
│   │           ├── validators/# Validaciones cliente
│   │           ├── errors/    # Manejo de errores
│   │           └── utils/     # Utilidades
│   ├── Dockerfile
│   └── package.json
│
├── docs/                       # Documentación
│   ├── architecture/
│   ├── api/
│   ├── database/
│   └── deployment/
│
├── .github/
│   └── workflows/              # CI/CD
│
├── docker-compose.yml
├── README.md
└── CONTRIBUTING.md
```

## 🌿 **Estrategia de Branches**

### **Branches Permanentes:**
- `main` → Producción (código estable, protegida)
- `dev` → Integración continua (donde se mergea todo)

### **Branches Temporales:**
- `feature/<scope>-<descripcion>` → Nueva funcionalidad
- `fix/<scope>-<descripcion>` → Corrección de bug
- `chore/<descripcion>` → Tareas de mantenimiento
- `docs/<tema>` → Documentación

## 📋 **Sprints Planificados**

1. **Sprint 1**: Fundación Arquitectónica
   - ✅ RF-001: Servicio de Configuración Base (en desarrollo)
   - 📋 RF-002: Integración con Stock (Cliente HTTP)
   - 📋 RF-003: Servicio de Cotización
2. **Sprint 2**: Creación y Gestión de Envíos
3. **Sprint 3**: Tracking y Estados
4. **Sprint 4**: Planificación y Rutas
5. **Sprint 5**: Refinamiento e Integración
6. **Sprint 6**: Polish y Entrega

## 🎯 **Objetivos de Desarrollo**

- Implementar flujo completo de logística punto a punto
- Integrar con Portal de Compras y Stock vía APIs REST
- Mantener trazabilidad completa de envíos
- Generar documentación operativa
- Proporcionar tracking por polling
- Gestionar problemas y reintentos
- Optimizar rutas de entrega

## 📝 **Notas Importantes**

- **Desarrollo secuencial**: Se va implementando sprint por sprint
- **Integración por polling**: No hay webhooks, Portal consulta estados
- **Responsabilidades claras**: Cada módulo tiene responsabilidades específicas
- **Documentación**: Cada módulo tiene su propia OpenAPI
- **Monorepo**: Un solo repositorio para todo el proyecto
- **Backend primero**: Enfoque inicial en backend, frontend después
