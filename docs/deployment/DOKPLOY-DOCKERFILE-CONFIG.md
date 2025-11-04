# 🐳 Configuración de Dockerfiles en Dokploy

**Fecha:** 2025-11-04
**Proyecto:** TPI Logística - Grupo 12
**Propósito:** Cómo configurar correctamente los Dockerfiles para Dokploy

---

## ⚠️ Problema Crítico Identificado

### Error Original en Dokploy

```
ERROR: failed to calculate checksum of ref: "/backend/package.json": not found
ERROR: failed to calculate checksum of ref: "/pnpm-workspace.yaml": not found
```

### Causa

Los Dockerfiles fueron diseñados para **build context de monorepo root**:
```dockerfile
# ❌ ANTES (asume build context = raíz del monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/services/config-service ./backend/services/config-service
```

Pero **Dokploy usa build context = servicio individual**:
```bash
# Dokploy hace:
cd /etc/dokploy/applications/.../code/backend/services/config-service
docker build -f Dockerfile .
# Build context = /backend/services/config-service
# NO tiene acceso a /backend/services/stock-service, ../../pnpm-lock.yaml, etc
```

---

## ✅ Solución Implementada

### Nuevo Enfoque (Service-Level Context)

```dockerfile
FROM node:20-alpine AS base
# ... setup ...

FROM base AS builder
# ✅ Copiar SOLO lo que está en el servicio
COPY . .

# ✅ Instalar dependencias localmente
RUN pnpm install --no-frozen-lockfile

# ✅ Compilar con npm run build
RUN npm run build

FROM base AS production
# ... copiar dist y node_modules ...
```

### Ventajas
```
✅ Funciona con build context de servicio
✅ No requiere rutas absolutas
✅ Compatible con Dokploy "out of the box"
✅ Cada servicio es autónomo
```

### Trade-offs
```
⚠️ Sin --frozen-lockfile (menos reproducible, pero es OK)
⚠️ Instala deps en cada build (pero Dokploy cachea)
⚠️ No comparte node_modules entre servicios (esperado)
```

---

## 📋 Configuración en Dokploy por Servicio

### **Config Service**

**Dockerfile Location:** `/backend/services/config-service/Dockerfile`

**Dokploy Settings:**
```
Service Type: Docker
Dockerfile Path: Dockerfile
Docker Context: ./backend/services/config-service
Port: 3003
Environment Variables:
  - NODE_ENV=production
  - PORT=3003
  - DATABASE_URL=postgresql://user:pass@postgres:5432/logistica_db
```

**Test:**
```bash
curl http://config-service:3003/health
# Should return: {"status":"ok",...}
```

---

### **Shipping Service**

**Dockerfile Location:** `/backend/services/shipping-service/Dockerfile`

**Dokploy Settings:**
```
Service Type: Docker
Dockerfile Path: Dockerfile
Docker Context: ./backend/services/shipping-service
Port: 3001
Environment Variables:
  - NODE_ENV=production
  - PORT=3001
  - DATABASE_URL=postgresql://user:pass@postgres:5432/logistica_db
```

**Test:**
```bash
curl http://shipping-service:3001/health
```

---

### **Stock Integration Service**

**Dockerfile Location:** `/backend/services/stock-integration-service/Dockerfile`

**Dokploy Settings:**
```
Service Type: Docker
Dockerfile Path: Dockerfile
Docker Context: ./backend/services/stock-integration-service
Port: 3002
Environment Variables:
  - NODE_ENV=production
  - PORT=3002
  - DATABASE_URL=postgresql://user:pass@postgres:5432/logistica_db
```

**Test:**
```bash
curl http://stock-integration-service:3002/health
```

---

### **Operator Interface Service**

**Dockerfile Location:** `/backend/services/operator-interface-service/Dockerfile`

**Dokploy Settings:**
```
Service Type: Docker
Dockerfile Path: Dockerfile
Docker Context: ./backend/services/operator-interface-service
Port: 3004
Environment Variables:
  - NODE_ENV=production
  - PORT=3004
  - CONFIG_SERVICE_URL=http://config-service:3003
  - SHIPPING_SERVICE_URL=http://shipping-service:3001
  - STOCK_SERVICE_URL=http://stock-integration-service:3002
```

**Test:**
```bash
curl http://localhost:3004/health
curl http://localhost:3004/gateway/status
```

---

### **Frontend**

**Dockerfile Location:** `/frontend/Dockerfile`

**Dokploy Settings:**
```
Service Type: Docker
Dockerfile Path: Dockerfile
Docker Context: ./frontend
Port: 3005
Build Arguments:
  - NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar:3004
  - NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
  - NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
  - NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
  - NEXT_PUBLIC_ENV=production
```

**Test:**
```bash
curl http://localhost:3005
# Should return HTML
```

---

## 🔧 Build Context en Dokploy

### Opción A: Usar Rutas Relativas (RECOMENDADO)

En Dokploy, al crear un servicio:

```
Build Context: ./backend/services/config-service
Dockerfile: Dockerfile
```

Dokploy resuelve esto como:
```
cd /etc/dokploy/applications/.../code
docker build -f ./backend/services/config-service/Dockerfile ./backend/services/config-service
```

✅ Esto funciona con nuestros Dockerfiles nuevos

---

### Opción B: Usar Root Context (NO FUNCIONA)

```
Build Context: .
Dockerfile: ./backend/services/config-service/Dockerfile
```

Esto resultaría en:
```
docker build -f ./backend/services/config-service/Dockerfile .
# Build context = raíz
# ✅ Funcionaría con los viejos Dockerfiles
# ❌ Pero requiere pnpm-lock.yaml, etc. en contexto
```

---

## 🚀 Deployment Checklist para Dokploy

### Para Cada Servicio Backend (config, shipping, stock, operator)

- [ ] **1. Crear Servicio en Dokploy**
  - [ ] Type: Docker
  - [ ] Source: GitHub (dsw-2025)
  - [ ] Branch: dev
  - [ ] Dockerfile: Dockerfile
  - [ ] Context: ./backend/services/{service-name}

- [ ] **2. Configurar Environment Variables**
  - [ ] NODE_ENV=production
  - [ ] PORT={3001|3002|3003|3004}
  - [ ] DATABASE_URL (para config, shipping, stock)
  - [ ] SERVICE_URLs (para operator)

- [ ] **3. Configurar Red**
  - [ ] Network: logistica-net (o crear si no existe)
  - [ ] Container hostname: {service-name}
  - [ ] Exponer puerto (solo para operator, frontend)

- [ ] **4. Configurar Salud**
  - [ ] Health Check URL: /health
  - [ ] Timeout: 10s
  - [ ] Retries: 3

- [ ] **5. Desplegar**
  - [ ] Build
  - [ ] Test health endpoint

---

## ⚡ Troubleshooting Dockerfiles en Dokploy

### Problema: "not found" errors

**Síntoma:**
```
ERROR: /pnpm-workspace.yaml: not found
```

**Causa:** Build context incorrecto

**Solución:**
```
✅ Asegurar Build Context = ./backend/services/config-service
❌ NO usar Build Context = .
```

---

### Problema: "pnpm install" falla

**Síntoma:**
```
RUN pnpm install --no-frozen-lockfile
# Error: Cannot find module 'pnpm'
```

**Causa:** pnpm no instalado

**Solución:**
```dockerfile
# En el Dockerfile debe estar:
RUN npm install -g pnpm@latest  # ✅ Ya está en base image
```

---

### Problema: "npm run build" falla

**Síntoma:**
```
RUN npm run build
# Error: Cannot find module 'typescript'
```

**Causa:** Deps no instaladas

**Solución:**
```dockerfile
# Orden correcto:
RUN pnpm install --no-frozen-lockfile  # ✅ Primero
RUN npm run build                      # ✅ Después
```

---

### Problema: Build es muy lento

**Síntoma:**
```
Step 3 : RUN pnpm install --no-frozen-lockfile
# Toma 5+ minutos
```

**Causa:** Sin caché de Docker

**Solución:**
```
1. Primera build: lenta (normal, instala deps)
2. Siguientes builds: rápidas (usa caché)

Si keeps rebuilding desde 0:
- Revisar Build Context
- Revisar que .dockerignore excluye node_modules
```

---

## 📊 Comparativa: Antes vs Después

### ANTES (Monorepo Context)

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS dependencies
# ❌ Requiere monorepo root context
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/shared/database/package.json ./backend/shared/database/
COPY backend/services/config-service/package.json ./backend/services/config-service/
```

**Requisitos:**
- Build context = raíz del monorepo
- Requiere pnpm-lock.yaml en contexto
- Requiere todos los package.json

**Funciona en:**
- ❌ Dokploy (build context = servicio)
- ✅ Local (cuando corres `docker build -f backend/services/config-service/Dockerfile .` desde raíz)

---

### DESPUÉS (Service Context)

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
# ✅ Solo usa lo que está en servicio
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN npm run build
```

**Requisitos:**
- Build context = servicio
- Solo necesita lo que esté en `backend/services/config-service/`
- Instala deps en cada build

**Funciona en:**
- ✅ Dokploy (build context = servicio)
- ✅ Local
- ✅ GitHub Actions
- ✅ Cualquier CI/CD

---

## 🎯 Resumen

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| Build Context | Monorepo root | Service directory |
| Funciona en Dokploy | ❌ NO | ✅ SÍ |
| Reproducibilidad | Excelente | Buena |
| Velocidad Build | Más lento | Más rápido |
| Complejidad | Media | Baja |
| Mantenimiento | Difícil | Fácil |

---

## 📖 Instrucciones para Dokploy

### Al Crear un Servicio

1. Click: "New Service"
2. Seleccionar: "Docker"
3. Configurar:
   ```
   Source: GitHub
   Repository: martinmalgor04/dsw-2025
   Branch: dev
   Dockerfile: Dockerfile
   Docker Context: ./backend/services/config-service
   ```
4. Click: "Create and Build"

### Orden de Despliegue

1. PostgreSQL (base)
2. Keycloak (auth)
3. Config Service
4. Shipping Service
5. Stock Service
6. Operator Gateway
7. Frontend

---

**Creado por:** Claude Code
**Fecha:** 2025-11-04
**Status:** ✅ Critical Fix Documentation
