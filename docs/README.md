# 📚 Documentación Técnica - TPI Logística Grupo 12

**Última actualización:** 2025-11-04

---

## 📋 Índice General

### **🏗️ Arquitectura**
Diseño del sistema y decisiones técnicas.

- **[README de Arquitectura](./architecture/README.md)** - Visión general
- **Microservicios:**
  - `operator-interface-service` (API Gateway)
  - `config-service` (Configuración y flota)
  - `shipping-service` (Envíos y cotizaciones)
  - `stock-integration-service` (Integración externa)
- **Librerías compartidas:**
  - `@logistics/database` (Prisma ORM)
  - `@logistics/types` (DTOs y tipos)
  - `@logistics/utils` (Utilidades)

**Cambio importante (2025-11-04):** Puertos ahora configurables vía env vars.
Ver: [`backend/services/operator-interface-service/src/core/service-registry.ts:42-64`](../backend/services/operator-interface-service/src/core/service-registry.ts)

---

### **🗄️ Base de Datos**
Schema, migraciones y gestión de datos.

- **[README de Database](./database/README.md)** - Documentación del schema
- **Schema Prisma:** `backend/shared/database/prisma/schema.prisma`
- **Migraciones:** `backend/shared/database/prisma/migrations/`
- **Seed:** `backend/shared/database/prisma/seed.ts`

**Modelos principales:**
- `TransportMethod` - Métodos de transporte
- `CoverageZone` - Zonas de cobertura
- `TariffConfig` - Configuración de tarifas
- `Vehicle` - Vehículos de la flota
- `Driver` - Conductores
- `Route` - Rutas planificadas
- `RouteStop` - Paradas de rutas

---

### **📡 API**
Endpoints, contratos y documentación Swagger.

- **[README de API](./api/README.md)** - Documentación de endpoints
- **Swagger UI (local):**
  - Config Service: http://localhost:3003/api
  - Operator Gateway: http://localhost:3004/api
  - Shipping Service: http://localhost:3001/api
  - Stock Service: http://localhost:3002/api

**Documentación específica:**
- **[Config Service Swagger](../backend/services/config-service/SWAGGER.md)**
- **[Operator Gateway](../backend/services/operator-interface-service/GATEWAY.md)**
- **[Tests E2E](../backend/services/operator-interface-service/TESTS.md)**

---

## 🔧 Guías por Tarea

### **Quiero entender la arquitectura:**
1. ✅ [`architecture/README.md`](./architecture/README.md)
2. ✅ Lee el código de `service-registry.ts` y `service-facade.ts`

### **Quiero desarrollar localmente:**
1. ✅ Sigue [`../backend/OPERATE-BACKEND.md`](../backend/OPERATE-BACKEND.md)
2. ✅ Instala dependencias: `pnpm install:all`
3. ✅ Build shared libs: `pnpm build:shared`
4. ✅ Inicia servicios: `pnpm dev`

---

## 📦 Cambios Recientes (2025-11-04)

### ✅ **Migración npm → pnpm completada**
- Eliminados todos los `package-lock.json`
- Dockerfiles actualizados para usar pnpm
- Scripts en `backend/package.json` actualizados

### ✅ **Puertos externalizados**
- `CONFIG_SERVICE_URL`, `SHIPPING_SERVICE_URL`, `STOCK_SERVICE_URL` ahora son env vars
- Ver: [`backend/services/operator-interface-service/.env.example`](../backend/services/operator-interface-service/.env.example)

### ✅ **Dockerfiles optimizados**
- Multi-stage build con caché eficiente
- Copia de dependencias separada de código
- .dockerignore agregado a todos los servicios

### ✅ **Documentación consolidada**
- Todo centralizado en `/docs`
- Guías de deployment actualizadas
- Networking y database documentados

---

## 📁 Estructura de /docs

```
docs/
├── README.md (este archivo)
├── architecture/
│   └── README.md
├── database/
│   └── README.md
└── api/
    └── README.md
```

---

## 🔗 Enlaces Externos

- **Repositorio:** [GitHub - martinmalgor04/dsw-2025](https://github.com/martinmalgor04/dsw-2025)
- **Dokploy:** [docs.dokploy.com](https://docs.dokploy.com)
- **Prisma:** [prisma.io/docs](https://www.prisma.io/docs)
- **NestJS:** [docs.nestjs.com](https://docs.nestjs.com)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)

---

## 📞 Soporte

- **Issues:** [GitHub Issues](https://github.com/martinmalgor04/dsw-2025/issues)
- **Pull Requests:** [GitHub PRs](https://github.com/martinmalgor04/dsw-2025/pulls)

---

**Mantenido por:** Grupo 12 - TPI Desarrollo de Software 2025
