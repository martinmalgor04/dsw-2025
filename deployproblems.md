# 🚨 Problemas de Despliegue - Estado Actual

**Fecha:** 2025-11-04
**Estado General:** ⚠️ Parcialmente Funcional - Múltiples Bloqueadores
**Prioridad:** CRÍTICA - Resolver antes de producción

---

## 📊 Resumen Ejecutivo

| Componente | Estado | Bloqueador | Severidad |
|-----------|--------|-----------|-----------|
| Frontend (Next.js) | 🟡 Parcial | Variables de env | 🔴 CRÍTICA |
| Operator Gateway | ✅ Funcional | - | ✅ OK |
| Microservicios | ✅ Funcional | Sin Dockerfiles | 🟡 MEDIA |
| Database (PostgreSQL) | ⏳ Pendiente | No documentado | 🟡 MEDIA |
| Keycloak | ⚠️ Unclear | Múltiples problemas | 🔴 CRÍTICA |
| JWT Validation | ❌ No impl. | Decisión pendiente | 🟡 MEDIA |
| SSL/TLS | ❌ No impl. | No documentado | 🔴 CRÍTICA |
| Networking | ⚠️ Unclear | Docker network? | 🟡 MEDIA |

---

## 🔴 PROBLEMAS CRÍTICOS (Bloquean Despliegue)

### 1. **Variables de Entorno Frontend - Inconsistentes**

**Problema:**
```
❌ NEXT_PUBLIC_API_URL = http://logistica.mmalgor.com.ar/operator-interface-service
❌ Debería ser: http://logistica.mmalgor.com.ar:3004
```

**Impacto:** Frontend no puede conectar al gateway

**Evidencia:**
- Documento: `DOKPLOY-ENV-FIX.md` línea 24-29
- Última actualización: Desconocida, puede estar resuelta o no

**Estado Actual:**
- [ ] ¿Se aplicó el fix?
- [ ] ¿Frontend conecta a /health del operator?
- [ ] ¿Qué error ves en DevTools Console?

**Checklist para Resolver:**
```bash
# Test 1: ¿Gateway es accesible?
curl http://logistica.mmalgor.com.ar:3004/health

# Test 2: ¿Frontend ve las variables?
# En DevTools Console: console.log(process.env.NEXT_PUBLIC_API_URL)

# Test 3: ¿Frontend hace request a API?
# Network tab → filter por "api" o "health"
```

**Solución:**
1. Actualizar `NEXT_PUBLIC_API_URL` en Dokploy a: `http://logistica.mmalgor.com.ar:3004`
2. Redeploy frontend
3. Verificar en DevTools Network tab que hace GET a `http://logistica.mmalgor.com.ar:3004/health`

---

### 2. **Keycloak - Multiple Configuration Issues**

**Problema 1: ¿Está Desplegado?**
```
No hay evidencia clara si Keycloak está corriendo en Dokploy
```

**Problema 2: Cliente ID Inconsistente**
```
Documentación dice:     NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
Pero DOKPLOY-ENV-FIX.md dice: grupo-02 (o verificar cuál es)
```

**Problema 3: Realm Unclear**
```
Documentación: ds-2025-realm
DOKPLOY-README: ds-2025-realm
DOKPLOY.md: ds-2025-realm

¿Es el mismo en todos lados?
```

**Problema 4: Redirection URI Mismatch**
```
¿Keycloak está configurado con redirect URI:
  - http://logistica.mmalgor.com.ar:3005/auth/callback

¿O es:
  - http://logistica.mmalgor.com.ar/auth/callback
  - http://IP:3005/auth/callback
  - Algo más?
```

**Impacto:** Login no funciona, OAuth2 flow falla

**Estado Actual:**
- [ ] ¿Keycloak está desplegado en Dokploy?
- [ ] ¿Es accesible? Test: `curl https://keycloak.mmalgor.com.ar`
- [ ] ¿Tiene certificado SSL válido?
- [ ] ¿El realm existe?
- [ ] ¿El cliente logix-frontend existe?
- [ ] ¿Está configurado correctamente?

**Solución:**
1. Verificar que Keycloak esté deployed
2. Acceder a: `https://keycloak.mmalgor.com.ar/admin`
3. Verificar Realm: `ds-2025-realm` existe
4. Verificar Client: `logix-frontend` existe
5. Verificar Redirect URIs:
   ```
   http://logistica.mmalgor.com.ar:3005/auth/callback
   http://logistica.mmalgor.com.ar:3005
   ```
6. Verificar Web Origins:
   ```
   http://logistica.mmalgor.com.ar:3005
   ```

---

### 3. **SSL/TLS - NO Configurado**

**Problema:**
```
Todo está documentado como HTTP, pero:
- keycloak.mmalgor.com.ar - probablemente HTTPS
- logistica.mmalgor.com.ar - probablemente HTTPS
- Certificados auto-firmados?
- ¿Cadena de certificados válida?
```

**Impacto:**
- Mixed Content (HTTP en HTTPS)
- CORS errors
- OAuth2 inseguro

**Estado Actual:**
- [ ] ¿HTTPS está habilitado en Dokploy?
- [ ] ¿Certificados están válidos?
- [ ] ¿Todos los URLs están en HTTPS?

**Checklist:**
```bash
# Test certificado
curl -v https://keycloak.mmalgor.com.ar
curl -v https://logistica.mmalgor.com.ar:3005

# Buscar errores de certificado
# "certificate verify failed" = problema
```

**Solución:**
1. Configurar SSL/TLS en Dokploy para todos los servicios
2. Usar Let's Encrypt o certificados válidos
3. Actualizar todas las URLs a HTTPS
4. Habilitar HSTS header

---

## 🟡 PROBLEMAS MEDIOS (Pueden impedir funcionalidad)

### 4. **Dockerfiles Faltantes para Microservicios**

**Problema:**
```
✅ frontend/Dockerfile - Existe
✅ backend/services/operator-interface-service/Dockerfile - Existe (JUST FIXED)
❌ backend/services/config-service/Dockerfile - NO EXISTE
❌ backend/services/shipping-service/Dockerfile - NO EXISTE
❌ backend/services/stock-integration-service/Dockerfile - NO EXISTE
```

**Impacto:** No se pueden desplegar los 3 microservicios de negocio

**Solución:**
Crear Dockerfiles para:
1. `backend/services/config-service/Dockerfile`
2. `backend/services/shipping-service/Dockerfile`
3. `backend/services/stock-integration-service/Dockerfile`

Pueden basarse en el patrón usado en operator-interface-service (single-stage).

---

### 5. **Database - Sin Estrategia Clara de Despliegue**

**Problema:**
```
¿Cómo se despliega PostgreSQL en Dokploy?
- ¿Contenedor Docker?
- ¿Servicio externo?
- ¿Managed PostgreSQL?

¿Cómo se ejecutan migraciones Prisma?
- ¿En startup del primer servicio?
- ¿En un init container?
- ¿Manual en Dokploy?
```

**Impacto:** Database puede no estar inicializada

**Estado Actual:**
- [ ] ¿PostgreSQL está desplegado?
- [ ] ¿Se pueden conectar los microservicios?
- [ ] ¿Las migraciones se ejecutaron?
- [ ] ¿Hay datos seed?

**Checklist:**
```bash
# Test desde un microservicio
curl http://IP:3003/config/transport-methods
# Si retorna 200 con data = migraciones OK
# Si retorna error de conexión = problema de DB
```

---

### 6. **Networking en Docker/Dokploy - No Documentado**

**Problema:**
```
¿Cómo se comunican los servicios entre sí?
- ¿Docker network que Dokploy crea?
- ¿Todos en el mismo network?
- ¿Service discovery por nombre?

Operator intenta conectar a:
- http://localhost:3003  (config-service)
- http://localhost:3001  (shipping-service)
- http://localhost:3002  (stock-service)

¿Funciona esto en Dokploy?
```

**Evidencia:**
```typescript
// operator-interface-service/src/infrastructure/service-registry.ts
const servicesConfig = [
  {
    name: 'config-service',
    baseUrl: 'http://localhost:3003',  // ⚠️ ¿Funciona en Docker?
    ...
  }
]
```

**Impacto:** Operator no puede conectar a microservicios = gateway falla

**Solución:**
1. Documentar la estrategia de networking
2. Actualizar URLs si es necesario (podría ser nombre del servicio, ej: `http://config-service:3003`)
3. Ensayar en Dokploy que los servicios puedan comunicarse

---

### 7. **Environment Variables - Incompletas**

**Problema:**
No hay estrategia clara para:
```
1. Dónde guardar secrets (passwords, API keys)
2. Cómo pasar al contenedor (ENV vars, secrets files, etc)
3. Rotation de secrets
4. Logging de acceso a secrets
```

**Ejemplo Faltante:**
```env
# No documentado:
DATABASE_PASSWORD=????
KEYCLOAK_ADMIN_PASSWORD=????
REDIS_PASSWORD=????
JWT_SECRET=????
```

**Impacto:** Inseguridad en producción

---

## 🟠 PROBLEMAS MODERADOS (Mejoras)

### 8. **JWT Validation - Sin Implementar**

**Problema:**
```
Documentación menciona 2 opciones:
- CON JWT: Validación en Operator (recomendado)
- SIN JWT: Sin validación (actual)

Actual = inseguro. Todos pueden hacer requests sin autenticación.
```

**Impacto:** Baja seguridad, endpoints públicos sin autenticación

**Estado:**
- [ ] ¿Decisión tomada sobre JWT?
- [ ] ¿Documentación dice SÍ?
- [ ] ¿Se implementó?

**Documentación Relacionada:**
- `JWT-IMPLEMENTATION-GUIDE.md` (si existe)
- `KEYCLOAK-DOKPLOY-DECISION.md` (si existe)

---

### 9. **Redis - Opcional pero No Configurado**

**Problema:**
```
Documentación menciona Redis para:
- Caché
- Sessions
- Rate limiting

Pero no está documentado cómo desplegarlo en Dokploy
```

**Impacto:** Bajo rendimiento, sin caché

---

### 10. **Logging y Monitoring - No Implementado**

**Problema:**
```
No hay forma de:
- Ver logs en tiempo real
- Alertas de errores
- Métricas de performance
- Health status de servicios
```

**Impacto:** Debugging imposible en producción

---

## 🟢 PROBLEMAS RESUELTOS ✅

### ✅ Operator Interface Service - Dockerfile Fixed

**Problema Original:**
```
Dockerfile multi-stage con pnpm symlink issues
```

**Solución:**
- Single-stage build
- Preserva pnpm symlink structure
- Todas las dependencias incluidas
- Health endpoints funcionales

**Status:** RESUELTO (commit 6599d22)

---

## 📋 Checklist de Resolución - Orden de Prioridad

### FASE 1: CRÍTICA (Antes de cualquier deploy)

- [ ] **1. Verificar Keycloak:**
  - [ ] ¿Está desplegado?
  - [ ] ¿Es accesible desde el público?
  - [ ] ¿Realm ds-2025-realm existe?
  - [ ] ¿Cliente logix-frontend está configurado?
  - [ ] ¿Redirect URIs están correctas?

- [ ] **2. Verificar Variables de Entorno:**
  - [ ] NEXT_PUBLIC_API_URL = http://logistica.mmalgor.com.ar:3004 ✅
  - [ ] NEXT_PUBLIC_KEYCLOAK_URL = https://keycloak.mmalgor.com.ar (verificar HTTPS)
  - [ ] NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = logix-frontend (verificar valor correcto)
  - [ ] Todos los servicios tienen su .env

- [ ] **3. SSL/TLS:**
  - [ ] Certificados válidos en todos los dominios
  - [ ] HTTPS habilitado
  - [ ] URLs actualizadas de HTTP → HTTPS donde aplique

### FASE 2: MEDIA (Antes de testing)

- [ ] **4. Crear Dockerfiles:**
  - [ ] backend/services/config-service/Dockerfile
  - [ ] backend/services/shipping-service/Dockerfile
  - [ ] backend/services/stock-integration-service/Dockerfile

- [ ] **5. Networking:**
  - [ ] Documentar cómo se comunican servicios en Dokploy
  - [ ] Actualizar URLs en operator si es necesario
  - [ ] Test de conectividad entre servicios

- [ ] **6. Database:**
  - [ ] PostgreSQL desplegado
  - [ ] Migraciones ejecutadas
  - [ ] Datos seed insertados

### FASE 3: BAJA (Post-deploy)

- [ ] **7. JWT Validation:**
  - [ ] Decidir SÍ o NO
  - [ ] Si SÍ: implementar según guía
  - [ ] Si NO: documentar riesgos de seguridad

- [ ] **8. Redis:**
  - [ ] Deploy (si se decide usarlo)
  - [ ] Configurar caché keys
  - [ ] Configurar sessions

- [ ] **9. Logging/Monitoring:**
  - [ ] Configurar agregación de logs
  - [ ] Dashboards de monitoring
  - [ ] Alertas de errores

---

## 🔍 Diagnóstico Rápido

### Para Verificar Estado Actual

```bash
# Test 1: ¿Frontend está up?
curl -I http://logistica.mmalgor.com.ar:3005

# Test 2: ¿Operator está up?
curl http://logistica.mmalgor.com.ar:3004/health

# Test 3: ¿Gateway puede llegar a servicios?
curl http://logistica.mmalgor.com.ar:3004/gateway/status

# Test 4: ¿Keycloak está up?
curl -I https://keycloak.mmalgor.com.ar

# Test 5: ¿Puedes llegar a config service?
curl http://logistica.mmalgor.com.ar:3004/config/transport-methods

# Test 6: En DevTools Console (frontend)
console.log(process.env.NEXT_PUBLIC_API_URL)
console.log(process.env.NEXT_PUBLIC_KEYCLOAK_URL)

# Test 7: Network tab al intentar login
# ¿Hace request a Keycloak?
# ¿Qué status code retorna?
```

---

## 📞 Debugging por Síntoma

### Frontend Carga Pero "Login No Funciona"

**Síntomas:**
```
- Página carga (HTML OK)
- Click en Login no hace nada
- Console: no hay errores
```

**Diagnóstico:**
```bash
# 1. Verifica variables de env
curl http://logistica.mmalgor.com.ar:3005 | grep -i "next"

# 2. Verifica Keycloak es accesible
curl https://keycloak.mmalgor.com.ar/realms/ds-2025-realm

# 3. En DevTools Console:
console.log(process.env)

# 4. En Network tab:
# - Busca requests a keycloak
# - ¿Error CORS?
# - ¿Redirección perdida?
```

---

### Frontend Carga Pero API Calls Fallan (404)

**Síntomas:**
```
- Frontend carga
- Al intentar cargar datos: 404
- Network tab: GET http://logistica.mmalgor.com.ar:3004/... → 404
```

**Diagnóstico:**
```bash
# 1. ¿Operator está up?
curl http://logistica.mmalgor.com.ar:3004/health

# 2. ¿Endpoint existe?
curl http://logistica.mmalgor.com.ar:3004/config/transport-methods

# 3. ¿Microservicio está up?
curl http://logistica.mmalgor.com.ar:3004/gateway/status
# Busca si config-service está "isHealthy": true

# 4. ¿URL de microservicio es correcta en operator?
# Ver: operator-interface-service/src/infrastructure/service-registry.ts
```

---

### Operator Muestra "Services Unhealthy"

**Síntomas:**
```
curl http://logistica.mmalgor.com.ar:3004/gateway/status
{
  "services": [
    {"name": "config-service", "isHealthy": false, ...}
  ]
}
```

**Diagnóstico:**
```bash
# 1. ¿Microservicio está deployed?
curl http://logistica.mmalgor.com.ar:3003/health

# 2. ¿URL en operator es correcta?
# Si está como http://localhost:3003,
# probablemente debería ser http://config-service:3003

# 3. ¿Docker network está configurado?
docker network ls
docker network inspect logistica-net
```

---

## 📚 Documentación Relacionada

| Documento | Estado | Relevancia |
|-----------|--------|-----------|
| DOKPLOY.md | 🟡 Incompleto | Frontend Dockerfile |
| DOKPLOY-ENV-FIX.md | 🔴 Critical | Variables de env frontend |
| DOKPLOY-README-QUICK.md | 🟡 Parcial | Visión general |
| KEYCLOAK-CONFIG.md | ? | No encontrado |
| JWT-IMPLEMENTATION-GUIDE.md | ? | No encontrado |
| keycloak/env.example | ✅ Existe | Variables Keycloak |

---

## 🎯 Próximos Pasos Recomendados

### Inmediato (Hoy)
1. Verificar status actual de cada servicio (tests de curl anteriores)
2. Documentar en qué estado está realmente Keycloak
3. Confirmar URL correcta de API_URL

### Corto Plazo (Esta Semana)
1. Crear Dockerfiles faltantes
2. Resolver issues de Keycloak si las hay
3. Test en Dokploy de conectividad

### Mediano Plazo (Próximas 2 Semanas)
1. Implementar JWT validation
2. Configurar logging/monitoring
3. Load testing

---

## 📝 Notas Finales

**Estado:** El sistema está **funcional en desarrollo** pero tiene **múltiples bloqueadores para producción**.

**Riesgo:** Desplegar sin resolver:
- Keycloak configuration
- Variables de entorno
- SSL/TLS
- Microservices networking

Resultaría en una aplicación **no funcional en producción**.

**Recomendación:** Resolver todos los problemas CRÍTICOS antes de cualquier deploy.

---

**Última actualización:** 2025-11-04
**Responsable:** Team Deployment
**Revisar:** Cuando hayas verificado cada problema
