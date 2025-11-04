# 📦 Módulo de Transporte, Logística y Seguimiento

> **Trabajo Práctico Integrador - Desarrollo de Software 2025**
> **UTN FRRE - Facultad Regional Resistencia - Grupo 12**

## 📚 Documentación

**Toda la documentación técnica está centralizada en [`/docs`](./docs/)**

### Guías Rápidas:
- 🚀 **[Deployment en Dokploy](./docs/deployment/INDEX.md)** - Guía completa de despliegue
- 🌐 **[Networking](./docs/deployment/DOKPLOY-NETWORKING.md)** - Configuración de red y servicios
- 🗄️ **[Database](./docs/deployment/DOKPLOY-DATABASE.md)** - PostgreSQL + Prisma
- 🏗️ **[Arquitectura](./docs/architecture/README.md)** - Diseño del sistema
- 📡 **[API](./docs/api/README.md)** - Endpoints y contratos

---

## 🎯 Descripción del Proyecto

Sistema de gestión logística que opera en modelo punto a punto (A→B): retira mercadería en depósitos de Stock y entrega directamente al cliente final, sin sucursales intermedias ni centros de distribución propios.

### Responsabilidades del Módulo:
- ✅ Cotizar costo y tiempo de envío
- ✅ Crear y gestionar envíos post-compra
- ✅ Planificar retiros en depósitos de Stock
- ✅ Coordinar y ejecutar retiros físicos
- ✅ Planificar rutas de entrega optimizadas
- ✅ Ejecutar entregas con evidencia digital
- ✅ Gestionar problemas, reintentos y reprogramaciones
- ✅ Procesar cancelaciones (dentro de ventana permitida)
- ✅ Gestionar devoluciones a Stock
- ✅ Mantener trazabilidad completa
- ✅ Generar documentación operativa

## 🏗️ Arquitectura

### Ecosistema Completo:
- **Portal de Compras**: Venta, cobro, gestión de catálogo
- **Stock**: Gestión de inventario y reservas
- **Logística** (este módulo): Transporte y seguimiento

### Stack Tecnológico:
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS
- **Cache**: Redis
- **Documentación**: OpenAPI/Swagger
- **Testing**: Jest
- **DevOps**: Docker + Docker Compose + GitHub Actions

## 📁 Estructura del Proyecto

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

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose
- Git

### Configuración Local

1. **Clonar el repositorio:**
```bash
git clone https://github.com/FRRe-DS/2025-12-TPI.git
cd 2025-12-TPI
```

2. **Configurar variables de entorno:**
```bash
cp env.example .env
# Editar .env con tus configuraciones
```

3. **Levantar servicios de base de datos:**
```bash
docker-compose up -d
```

4. **Configurar backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

5. **Ejecutar en modo desarrollo:**
```bash
# Backend
cd backend
npm run start:dev

# Frontend (cuando esté implementado)
cd frontend
npm install
npm run dev
```

## 🐳 Docker (Recomendado)

### Comandos Principales
```bash
# Desarrollo
./scripts/docker.sh up-dev      # Levantar servicios de desarrollo
./scripts/docker.sh logs         # Ver logs
./scripts/docker.sh health       # Verificar health

# Producción
./scripts/docker.sh build        # Construir imágenes
./scripts/docker.sh up          # Levantar servicios de producción

# Gestión
./scripts/docker.sh status       # Ver estado
./scripts/docker.sh clean        # Limpiar Docker
```

### Servicios Disponibles
- **Frontend**: http://localhost:80
- **API Gateway**: http://localhost:3004
- **Config Service**: http://localhost:3003
- **Stock Service**: http://localhost:3002
- **Shipping Service**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

📖 **Documentación completa**: [DOCKER.md](./DOCKER.md)

## 🔗 APIs y Endpoints

### APIs que EXPONEMOS:
```
POST /shipping/cost     → Cotizar envío
POST /shipping          → Crear envío
GET /shipping/{id}      → Consultar estado
POST /shipping/{id}/cancel → Cancelar envío
GET /shipping/{id}/pod  → Obtener POD
```

### APIs que CONSUMIMOS:
```
GET /productos/{id}     → Consultar producto (Stock)
GET /reservas/{id}      → Validar reserva (Stock)
```

## 🔄 Flujo de Estados

```
created → pickup_scheduled → picking_up → picked_up → 
out_for_delivery → delivered ✅

Desvíos:
created → cancelled ❌
pickup_scheduled → cancelled ❌
out_for_delivery → delivery_failed → out_for_delivery (reintento)
delivery_failed → returning → returned ❌
```

## 🌿 Estrategia de Branches

### Branches Permanentes:
- `main` → Producción (código estable, protegida)
- `dev` → Integración continua (donde se mergea todo)

### Branches Temporales:
- `feature/<scope>-<descripcion>` → Nueva funcionalidad
- `fix/<scope>-<descripcion>` → Corrección de bug
- `chore/<descripcion>` → Tareas de mantenimiento
- `docs/<tema>` → Documentación

## 📋 Sprints Planificados

1. **Sprint 1**: Fundación Arquitectónica
2. **Sprint 2**: Creación y Gestión de Envíos
3. **Sprint 3**: Tracking y Estados
4. **Sprint 4**: Planificación y Rutas
5. **Sprint 5**: Refinamiento e Integración
6. **Sprint 6**: Polish y Entrega

## 🛠️ Comandos Útiles

### Backend
```bash
cd backend
npm run start:dev      # Desarrollo
npm run build          # Compilar
npm run test           # Tests
npm run test:e2e       # Tests E2E
npx prisma studio      # Interfaz BD
npx prisma migrate dev # Migraciones
```

### Docker
```bash
docker-compose up -d   # Levantar servicios
docker-compose down    # Detener servicios
docker-compose logs    # Ver logs
```

## 📚 Documentación

- [API Testing Guide](./API-TESTING.md)
- [OpenAPI Specification](./openapilog.yaml)
- [Project Context](./memory/project-context.md)
- [Constitution](./memory/constitution.md)

## 👥 Equipo

**Grupo 12 - Desarrollo de Software 2025 - UTN FRRE**

## 📄 Licencia

Apache-2.0

## 🔗 Enlaces

- **Repositorio**: https://github.com/FRRe-DS/2025-12-TPI
- **Documentación**: [Ver docs/](./docs/)
- **Issues**: https://github.com/FRRe-DS/2025-12-TPI/issues