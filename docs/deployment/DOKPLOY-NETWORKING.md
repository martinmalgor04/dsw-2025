# 🌐 Networking en Dokploy - Guía de Configuración

**Fecha:** 2025-11-04
**Proyecto:** TPI Logística - Grupo 12
**Propósito:** Configuración de networking para microservicios independientes en Dokploy

---

## 📊 Arquitectura de Red

```
┌─────────────────────────────────────────────────┐
│              INTERNET / USUARIO                 │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │  PROXY NGINX   │ (puerto 80/443)
        │   (Dokploy)    │
        └───┬────────┬───┘
            │        │
   ┌────────┴──┐  ┌─┴──────────┐
   │ Frontend  │  │  Operator  │
   │  :3005    │  │  Gateway   │
   └───────────┘  │  :3004     │
                  └─┬──────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼────┐   ┌────▼────┐   ┌────▼────┐
│ Config  │   │Shipping │   │  Stock  │
│ Service │   │ Service │   │ Service │
│  :3003  │   │  :3001  │   │  :3002  │
└────┬────┘   └────┬────┘   └─────────┘
     │             │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │ PostgreSQL  │
     │    :5432    │
     └─────────────┘
```

---

## 🔧 Configuración por Servicio

### **1. Frontend (Next.js)**

**Puerto:** 3005
**Tipo:** Aplicación web (SSR + cliente)

**Variables de Entorno:**
```env
# En Dokploy UI
NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar:3004
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
NEXT_PUBLIC_ENV=production
```

**Networking:**
- ✅ Acceso público (puerto 3005 expuesto)
- ✅ NO necesita conectar a otros servicios directamente
- ✅ Solo habla con Operator Gateway vía HTTP

---

### **2. Operator Interface Service (API Gateway)**

**Puerto:** 3004
**Tipo:** Gateway/Proxy centralizado

**Variables de Entorno:**
```env
NODE_ENV=production
PORT=3004

# IMPORTANTE: URLs de servicios backend
# Usar nombres de servicios de Dokploy
CONFIG_SERVICE_URL=http://config-service:3003
SHIPPING_SERVICE_URL=http://shipping-service:3001
STOCK_SERVICE_URL=http://stock-integration-service:3002
```

**Networking:**
- ✅ Acceso público (puerto 3004 expuesto)
- ✅ Debe conectar a los 3 microservicios internamente
- ⚠️ **CRÍTICO**: Verificar que puede resolver nombres de servicios

**Test de Conectividad:**
```bash
# Desde dentro del contenedor operator
docker exec -it <operator-container-id> sh
curl http://config-service:3003/health
curl http://shipping-service:3001/health
curl http://stock-integration-service:3002/health
```

---

### **3. Config Service**

**Puerto:** 3003
**Tipo:** Microservicio de configuración

**Variables de Entorno:**
```env
NODE_ENV=production
PORT=3003
DATABASE_URL=postgresql://user:password@postgres:5432/logistica_db
```

**Networking:**
- ❌ NO exponer puerto público
- ✅ Solo accesible desde Operator Gateway
- ✅ Conecta a PostgreSQL

---

### **4. Shipping Service**

**Puerto:** 3001
**Tipo:** Microservicio de envíos

**Variables de Entorno:**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@postgres:5432/logistica_db
STOCK_SERVICE_URL=http://stock-integration-service:3002
```

**Networking:**
- ❌ NO exponer puerto público
- ✅ Solo accesible desde Operator Gateway
- ✅ Conecta a PostgreSQL
- ✅ Conecta a Stock Service (opcional, mejor vía gateway)

---

### **5. Stock Integration Service**

**Puerto:** 3002
**Tipo:** Microservicio de integración externa

**Variables de Entorno:**
```env
NODE_ENV=production
PORT=3002
STOCK_API_URL=https://stock.ds.frre.utn.edu.ar/v1
REDIS_URL=redis://redis:6379
```

**Networking:**
- ❌ NO exponer puerto público
- ✅ Solo accesible desde Operator Gateway
- ✅ Conecta a API externa de Stock
- ✅ Conecta a Redis (opcional)

---

## 🐳 Configuración en Dokploy

### **Estrategia 1: Servicios Independientes (RECOMENDADO)**

Crear cada servicio por separado en Dokploy:

1. **Crear servicio "frontend"**
   - Dockerfile: `frontend/Dockerfile`
   - Puerto: 3005
   - Env vars: Ver sección Frontend arriba

2. **Crear servicio "operator-interface-service"**
   - Dockerfile: `backend/services/operator-interface-service/Dockerfile`
   - Puerto: 3004
   - Env vars: Ver sección Operator arriba
   - **IMPORTANTE**: Configurar URLs de servicios backend

3. **Crear servicio "config-service"**
   - Dockerfile: `backend/services/config-service/Dockerfile`
   - Puerto: 3003 (INTERNO)
   - Env vars: DATABASE_URL

4. **Crear servicio "shipping-service"**
   - Dockerfile: `backend/services/shipping-service/Dockerfile`
   - Puerto: 3001 (INTERNO)
   - Env vars: DATABASE_URL

5. **Crear servicio "stock-integration-service"**
   - Dockerfile: `backend/services/stock-integration-service/Dockerfile`
   - Puerto: 3002 (INTERNO)
   - Env vars: STOCK_API_URL, REDIS_URL

### **Estrategia 2: Docker Network Compartida (SI DOKPLOY LO SOPORTA)**

Si Dokploy permite Docker networks compartidas:

```bash
# Crear network
docker network create logistica-network

# Conectar cada servicio a la network en Dokploy UI
```

---

## ✅ Checklist de Verificación

### **Post-Deploy Networking Tests:**

```bash
# 1. Frontend accesible desde internet
curl -I http://logistica.mmalgor.com.ar:3005

# 2. Operator Gateway accesible desde internet
curl http://logistica.mmalgor.com.ar:3004/health

# 3. Gateway puede ver servicios internos
curl http://logistica.mmalgor.com.ar:3004/gateway/status
# Debe retornar todos los servicios con "isHealthy": true

# 4. Frontend puede llamar a API
# Desde DevTools Console:
fetch('http://logistica.mmalgor.com.ar:3004/config/transport-methods')
  .then(r => r.json())
  .then(console.log)
```

### **Troubleshooting:**

| Error | Causa Probable | Solución |
|-------|----------------|----------|
| `ECONNREFUSED` | Servicio no está corriendo | Verificar logs del servicio |
| `getaddrinfo ENOTFOUND config-service` | DNS no resuelve nombre de servicio | Verificar que están en misma Docker network |
| `502 Bad Gateway` | Operator no puede conectar a servicio | Verificar `CONFIG_SERVICE_URL` etc. |
| Frontend: `net::ERR_CONNECTION_REFUSED` | `NEXT_PUBLIC_API_URL` incorrecta | Verificar variable de entorno |

---

## 🔐 Consideraciones de Seguridad

1. **Microservicios internos**: NO exponer puertos 3001, 3002, 3003 públicamente
2. **Solo Operator Gateway expuesto**: Frontend y Operator en puertos públicos
3. **SSL/TLS**: Usar HTTPS en producción
4. **Firewall**: Configurar reglas para limitar acceso

---

## 📚 Referencias

- [Archivo de configuración]: `backend/services/operator-interface-service/src/core/service-registry.ts:42-64`
- [Variables de entorno ejemplo]: `backend/services/operator-interface-service/.env.example`
- [Documentación oficial Dokploy]: https://docs.dokploy.com/

---

**Última actualización:** 2025-11-04
**Responsable:** DevOps Team
