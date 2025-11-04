# Dokploy Deployment - Quick Reference

**Estado del Proyecto:** ✅ Listo para despliegue
**Fecha:** 2025-11-04
**Próximo Paso:** Deploy en Dokploy

---

## 🎯 Checklist Pre-Deployment

```
✅ Frontend (Next.js)              - Listo
✅ Operator Gateway (:3004)        - Listo, ⏳ JWT decision
✅ Config Service (:3003)          - Listo
✅ Shipping Service (:3001)        - Listo
✅ Stock Service (:3002)           - Listo
✅ Database (PostgreSQL)           - Listo
✅ Dockerfiles (5/5)               - Listos
✅ Environment Variables           - Documentados
✅ Health Checks                   - Configurados
✅ Tests E2E                       - Funcionando
⏳ JWT Validation (Opcional)       - Decisión pendiente
```

---

## 🏗️ Arquitectura para Dokploy

```
┌─────────────────────────────────────────────────────────┐
│           Dokploy Server (144.22.130.30)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Docker Network: logistica-net                    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  Frontend (:3005)       Operator (:3004)        │  │
│  │  ├─ Next.js app         ├─ JWT Guard*          │  │
│  │  ├─ Keycloak auth       ├─ Service Registry    │  │
│  │  └─ React 19            ├─ Proxy Router        │  │
│  │                         └─ X-Request-ID        │  │
│  │                                                  │  │
│  │  Config (:3003)    Shipping (:3001)  Stock (:3002)│
│  │  ├─ Transports     ├─ Shipments     ├─ Inventory│
│  │  ├─ Coverage       ├─ Costs         └─ Reserves │
│  │  └─ Tariffs        └─ Tracking      (*) = Optional│
│  │                                                  │  │
│  │  PostgreSQL (5432)        Redis (6379)          │  │
│  │  ├─ logistica_db          ├─ Cache              │  │
│  │  └─ Prisma migrations     └─ Sessions           │  │
│  │                                                  │  │
│  │  Keycloak (:8080) - SSO                         │  │
│  │  └─ realm: ds-2025-realm                        │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  (* = JWT Guard es optional, decide tú)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Servicios a Desplegar (En Orden)

### 1. PostgreSQL
```
Puerto: 5432
Usuario: logistica
Password: [set en Dokploy]
Database: logistica_db
Migraciones: Automáticas en startup
```

### 2. Redis (Opcional pero Recomendado)
```
Puerto: 6379
Uso: Caché, sessions, rate limiting
```

### 3. Keycloak
```
Puerto: 8080
Realm: ds-2025-realm
Admin Console: http://IP:8080/admin
```

### 4. Microservicios Backend (cualquier orden)
```
Config Service      :3003
Shipping Service    :3001
Stock Service       :3002
Operator Gateway    :3004
```

### 5. Frontend
```
Puerto: 3005
Depende de: Operator (:3004) y Keycloak
```

---

## 🔧 Environment Variables por Servicio

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=http://IP:3004
NEXT_PUBLIC_KEYCLOAK_URL=http://IP:8080
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
NEXT_PUBLIC_ENV=production
```

### Operator (.env)
```env
PORT=3004
FRONTEND_URL=http://IP:3005
KEYCLOAK_URL=http://IP:8080
KEYCLOAK_REALM=ds-2025-realm
NODE_ENV=production
BACKEND_BASE_URL=http://localhost
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Config Service (.env)
```env
PORT=3003
DATABASE_URL=postgresql://logistica:PASS@localhost:5432/logistica_db
NODE_ENV=production
```

### Shipping Service (.env)
```env
PORT=3001
DATABASE_URL=postgresql://logistica:PASS@localhost:5432/logistica_db
NODE_ENV=production
```

### Stock Service (.env)
```env
PORT=3002
DATABASE_URL=postgresql://logistica:PASS@localhost:5432/logistica_db
NODE_ENV=production
```

---

## ✅ Testing Post-Deployment

### Health Checks
```bash
# Todos servicios
curl http://IP:3004/health
curl http://IP:3004/gateway/status

# Frontend
curl http://IP:3005

# Keycloak
curl http://IP:8080
```

### API Tests
```bash
# Config
curl http://IP:3004/config/transport-methods

# Shipping
curl http://IP:3004/shipping/shipments

# Stock
curl http://IP:3004/stock/inventory
```

### Con Autenticación (Si implementaste JWT)
```bash
# Obtener token de Keycloak
TOKEN=$(curl -X POST http://IP:8080/realms/ds-2025-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=logix-frontend&username=USER&password=PASS&grant_type=password" \
  | jq -r '.access_token')

# Usar token
curl -H "Authorization: Bearer $TOKEN" http://IP:3004/config/transport-methods
```

---

## 🚀 Dos Opciones Finales

### Opción 1: CON JWT Validation (Recomendado)
```
Tiempo Setup: +1-2 horas
Seguridad: ⭐⭐⭐⭐⭐
Complejidad: Media
Documentación: JWT-IMPLEMENTATION-GUIDE.md
```

**Flujo:**
```
Request → Operator JWT Guard → Valida contra Keycloak → ✅ Proxea o ❌ 401
```

### Opción 2: SIN JWT Validation (Actual)
```
Tiempo Setup: Inmediato
Seguridad: ⭐⭐ (solo frontend)
Complejidad: Baja
```

**Flujo:**
```
Request → Operator → Proxea sin verificar → Microservicio recibe token
```

---

## 📚 Documentación Relacionada

| Documento | Propósito |
|-----------|-----------|
| `KEYCLOAK-DOKPLOY-DECISION.md` | Decisión rápida sobre JWT |
| `KEYCLOAK-CONFIG.md` | Detalles de Keycloak |
| `JWT-IMPLEMENTATION-GUIDE.md` | Código para implementar JWT |
| `DOKPLOY-DEPLOYMENT-CHECKLIST.md` | Checklist completo |
| `RECENT-CHANGES.md` | Qué cambió en Phase 7-10 |

---

## ⚡ Quick Start Dokploy

```bash
# 1. Crear servicios en Dokploy en este orden:
#    a) PostgreSQL (5432)
#    b) Redis (6379) - opcional
#    c) Keycloak (8080)

# 2. Deploy microservicios backend (cualquier orden)
#    a) Config Service (3003) - Dockerfile: backend/services/config-service/Dockerfile
#    b) Shipping Service (3001) - Dockerfile: backend/services/shipping-service/Dockerfile
#    c) Stock Service (3002) - Dockerfile: backend/services/stock-integration-service/Dockerfile
#    d) Operator Gateway (3004) - Dockerfile: backend/services/operator-interface-service/Dockerfile

# 3. Deploy frontend (3005)
#    Dockerfile: frontend/Dockerfile

# 4. Verificar
curl http://IP:3004/health
curl http://IP:3004/gateway/status
curl http://IP:3005
```

---

## 🔒 Security Checklist

- [ ] PostgreSQL con password fuerte
- [ ] Keycloak admin password configurado
- [ ] CORS origin correcto (FRONTEND_URL)
- [ ] Secrets no en .env, usar variables de Dokploy
- [ ] SSL/TLS configurado (si HTTPS)
- [ ] Firewall: abrir solo puertos necesarios
- [ ] Backups de database scheduled
- [ ] Logs monitoreados
- [ ] Rate limiting activo (RATE_LIMIT_*)
- [ ] JWT validation (Opción 1) o documentar falta de seguridad

---

## 📞 Support Docs

**¿Problema?** Revisar:
- `RECENT-CHANGES.md` - Qué cambió
- `GATEWAY.md` - Cómo funciona el proxy
- `TESTS.md` - Cómo correr tests
- `KEYCLOAK-CONFIG.md` - Problemas de autenticación

---

## 🎯 Decision Time

**¿Implementas JWT en operator o desplegamos tal cual?**

- **SÍ, JWT:** Ejecuta `JWT-IMPLEMENTATION-GUIDE.md` (1-2 horas)
- **NO, tal cual:** Procede directo a Dokploy con `DOKPLOY-DEPLOYMENT-CHECKLIST.md`

**Recomendación:** SÍ, JWT. Es simple y mucho más seguro.

---

**Status:** ✅ Ready for Dokploy
**Última actualización:** 2025-11-04
**Próximo paso:** Tu decisión sobre JWT → Deploy

