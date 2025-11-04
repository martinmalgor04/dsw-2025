# 🗄️ Database Strategy en Dokploy - PostgreSQL + Prisma

**Fecha:** 2025-11-04
**Proyecto:** TPI Logística - Grupo 12
**Propósito:** Configuración y despliegue de base de datos en Dokploy

---

## 📊 Arquitectura de Base de Datos

```
┌──────────────────────────────────────────┐
│         PostgreSQL 16                    │
│         (logistica_db)                   │
└───────────┬──────────────┬───────────────┘
            │              │
    ┌───────┴──────┐  ┌───┴──────┐
    │ config-      │  │shipping- │
    │ service      │  │ service  │
    │              │  │          │
    │ Via Prisma   │  │Via Prisma│
    │ ORM          │  │ ORM      │
    └──────────────┘  └──────────┘

Librer\u00eda Compartida: @logistics/database
```

---

## 🎯 Opciones de Deployment

### **Opción A: PostgreSQL en Dokploy (RECOMENDADO)**

Desplegar PostgreSQL como servicio independiente en Dokploy.

**Ventajas:**
- ✅ Gestión centralizada en Dokploy
- ✅ Backups automáticos (si Dokploy lo soporta)
- ✅ Fácil acceso desde todos los servicios
- ✅ Configuración simple

**Desventajas:**
- ⚠️ Requiere configuración de volúmenes persistentes
- ⚠️ Backups manuales si Dokploy no los provee

**Configuración:**
```yaml
# Crear servicio PostgreSQL en Dokploy
Image: postgres:16-alpine
Port: 5432 (INTERNO - NO EXPONER PÚBLICAMENTE)

Environment Variables:
POSTGRES_DB=logistica_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<tu-password-seguro>

# Volumen persistente
Volume: /var/lib/postgresql/data
```

**DATABASE_URL para servicios:**
```env
DATABASE_URL=postgresql://postgres:<password>@postgres:5432/logistica_db
```

---

### **Opción B: PostgreSQL Externo (Supabase, AWS RDS, etc.)**

Usar servicio de base de datos managed externo.

**Ventajas:**
- ✅ Backups automáticos
- ✅ Escalabilidad
- ✅ Alta disponibilidad
- ✅ No consume recursos de Dokploy

**Desventajas:**
- ⚠️ Costo adicional
- ⚠️ Latencia de red
- ⚠️ Configuración de acceso seguro

**DATABASE_URL para servicios:**
```env
DATABASE_URL=postgresql://user:password@external-host.supabase.com:5432/logistica_db
```

---

## 🔧 Migraciones Prisma

### **Problema:**
Las migraciones deben ejecutarse ANTES de que los servicios arranquen.

### **Estrategia 1: Init Container (RECOMENDADO)**

Crear un servicio "migrations" que corra una sola vez al deploy.

**Dockerfile de migraciones:**
```dockerfile
FROM node:20-alpine

RUN apk add --no-cache curl openssl \
    && npm install -g pnpm@latest

WORKDIR /app

# Copiar solo lo necesario para migraciones
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/shared/database/package.json ./backend/shared/database/
RUN pnpm install --filter @logistics/database

COPY backend/shared/database ./backend/shared/database

# Ejecutar migraciones y seed
CMD ["sh", "-c", "cd backend/shared/database && pnpm prisma migrate deploy && pnpm prisma db seed"]
```

**En Dokploy:**
1. Crear servicio "database-migrations"
2. Ejecutar UNA VEZ después de crear PostgreSQL
3. Borrar servicio después de éxito (o dejarlo para futuros deploys)

---

### **Estrategia 2: En startup de config-service**

Ejecutar migraciones al iniciar config-service (primer servicio).

**Modificar CMD en Dockerfile:**
```dockerfile
# backend/services/config-service/Dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

**Ventajas:**
- ✅ Automático en cada deploy
- ✅ No requiere servicio adicional

**Desventajas:**
- ⚠️ Retrasa startup de config-service
- ⚠️ Si falla migración, servicio no arranca

---

### **Estrategia 3: Manual (NO RECOMENDADO PARA PRODUCCIÓN)**

Ejecutar migraciones manualmente después de deploy.

```bash
# Conectar al contenedor de cualquier servicio
docker exec -it <config-service-container> sh

# Ejecutar migraciones
cd /app/prisma
npx prisma migrate deploy

# Seed (opcional)
npx prisma db seed
```

---

## 📦 Schema Prisma Actual

**Ubicación:** `backend/shared/database/prisma/schema.prisma`

**Modelos:**
```prisma
model TransportMethod {
  id              String
  code            String
  name            String
  averageSpeed    Int
  estimatedDays   String
  baseCostPerKm   Decimal
  baseCostPerKg   Decimal
  isActive        Boolean
  createdAt       DateTime
  updatedAt       DateTime

  // Relaciones
  routes          Route[]
  tariffConfigs   TariffConfig[]
  vehicles        Vehicle[]
}

model CoverageZone {
  id          String
  name        String
  postalCodes String[]
  createdAt   DateTime
  updatedAt   DateTime

  routes      Route[]
}

model TariffConfig {
  id                String
  transportMethodId String
  environment       String
  baseTariff        Decimal
  costPerKg         Decimal
  costPerKm         Decimal
  isActive          Boolean
  createdAt         DateTime
  updatedAt         DateTime

  transportMethod   TransportMethod @relation(...)
}

model Vehicle {
  id                String
  license_plate     String @unique
  capacityKg        Float
  volumeM3          Float
  isActive          Boolean
  transportMethodId String
  driverId          String?
  createdAt         DateTime
  updatedAt         DateTime

  transportMethod   TransportMethod @relation(...)
  driver            Driver? @relation(...)
  routes            Route[]
}

model Driver {
  id           String
  employeeId   String @unique
  firstName    String
  lastName     String
  email        String
  phone        String
  licenseNumber String
  isActive     Boolean
  createdAt    DateTime
  updatedAt    DateTime

  vehicles     Vehicle[]
  routes       Route[]
}

model Route {
  id                String
  transportMethodId String
  vehicleId         String?
  driverId          String?
  coverageZoneId    String
  estimatedDistance Decimal
  status            String
  createdAt         DateTime
  updatedAt         DateTime

  stops             RouteStop[]
  transportMethod   TransportMethod @relation(...)
  vehicle           Vehicle? @relation(...)
  driver            Driver? @relation(...)
  coverageZone      CoverageZone @relation(...)
}

model RouteStop {
  id        String
  routeId   String
  sequence  Int
  type      String
  address   String
  latitude  Decimal?
  longitude Decimal?

  route     Route @relation(...)
}
```

---

## 🔄 Flujo de Deploy con Base de Datos

### **Primera vez (Setup inicial):**

```mermaid
sequenceDiagram
    participant Dokploy
    participant PostgreSQL
    participant Migrations
    participant Services

    Dokploy->>PostgreSQL: 1. Crear servicio PostgreSQL
    PostgreSQL-->>Dokploy: PostgreSQL corriendo
    Dokploy->>Migrations: 2. Ejecutar migrations
    Migrations->>PostgreSQL: prisma migrate deploy
    PostgreSQL-->>Migrations: Schema creado
    Migrations->>PostgreSQL: prisma db seed
    PostgreSQL-->>Migrations: Datos seed insertados
    Dokploy->>Services: 3. Deploy config-service
    Services->>PostgreSQL: Conectar vía DATABASE_URL
    PostgreSQL-->>Services: Conexión OK
    Dokploy->>Services: 4. Deploy shipping-service
    Services->>PostgreSQL: Conectar vía DATABASE_URL
    PostgreSQL-->>Services: Conexión OK
```

### **Deploys posteriores:**

```mermaid
sequenceDiagram
    participant Dokploy
    participant PostgreSQL
    participant Services

    Note over Dokploy: Nueva versión de código
    Dokploy->>Services: 1. Stop servicios viejos
    Dokploy->>Services: 2. Pull nueva imagen
    Dokploy->>Services: 3. Ejecutar migraciones (si hay)
    Services->>PostgreSQL: prisma migrate deploy
    PostgreSQL-->>Services: Migraciones aplicadas
    Dokploy->>Services: 4. Start servicios nuevos
    Services->>PostgreSQL: Conectar
    PostgreSQL-->>Services: OK
```

---

## ✅ Checklist de Configuración

### **Pre-Deploy:**
- [ ] PostgreSQL desplegado y corriendo
- [ ] DATABASE_URL configurada en todos los servicios
- [ ] Password seguro generado
- [ ] Volumen persistente configurado

### **Post-Deploy:**
- [ ] Migraciones ejecutadas exitosamente
- [ ] Datos seed insertados (si aplica)
- [ ] config-service conecta a BD
- [ ] shipping-service conecta a BD
- [ ] Health checks pasan en todos los servicios

---

## 🐛 Troubleshooting

### **Error: "Can't reach database server"**

**Causa:** DATABASE_URL incorrecta o PostgreSQL no accesible

**Solución:**
```bash
# Verificar desde dentro del contenedor
docker exec -it <service-container> sh
pg_isready -h postgres -p 5432

# Verificar env var
echo $DATABASE_URL
```

---

### **Error: "The table `TransportMethod` does not exist"**

**Causa:** Migraciones no ejecutadas

**Solución:**
```bash
# Ejecutar migraciones manualmente
docker exec -it <config-service-container> sh
cd /app/prisma
npx prisma migrate deploy
```

---

### **Error: "Migration failed to apply"**

**Causa:** Conflicto en migraciones

**Solución:**
```bash
# Ver estado de migraciones
npx prisma migrate status

# Si hay conflicto, resolver manualmente o:
npx prisma migrate resolve --applied <migration-name>
```

---

## 🔐 Seguridad

### **1. Passwords**
- ❌ NO usar passwords débiles
- ✅ Generar passwords con: `openssl rand -base64 32`
- ✅ Guardar en secrets de Dokploy (no en código)

### **2. Acceso**
- ❌ NO exponer puerto 5432 públicamente
- ✅ Solo servicios internos deben acceder
- ✅ Usar SSL/TLS para conexiones (en producción)

### **3. Backups**
- ✅ Configurar backups automáticos
- ✅ Testear restore periódicamente
- ✅ Guardar backups en ubicación externa

### **Comando de backup manual:**
```bash
# Desde host de Dokploy
docker exec <postgres-container> pg_dump -U postgres logistica_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i <postgres-container> psql -U postgres logistica_db < backup_20251104.sql
```

---

## 📚 Referencias

- [Schema Prisma]: `backend/shared/database/prisma/schema.prisma`
- [Migraciones]: `backend/shared/database/prisma/migrations/`
- [Seed]: `backend/shared/database/prisma/seed.ts`
- [Database Package]: `backend/shared/database/`

---

**Última actualización:** 2025-11-04
**Responsable:** Backend Team
