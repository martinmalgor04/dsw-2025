# Configuración Keycloak - Operator Interface Service

## 📋 Estado Actual

**❌ Keycloak NO está configurado en el Operator Service en este momento**

El operator actúa como **pure gateway proxy** sin validación de JWT. La autenticación se maneja completamente en el **frontend** a través de Keycloak-js, no en el backend.

## 🏗️ Arquitectura de Autenticación Actual

```
┌──────────────────────────┐
│  Frontend (Next.js)      │
│  - Keycloak-js client    │
│  - Login/logout flow     │
│  - Stores JWT token      │
└────────────┬─────────────┘
             │ Authorization header con JWT
             │ (si usuario está autenticado)
             ▼
┌──────────────────────────┐
│  Operator Gateway :3004  │
│  ✓ X-Request-ID generation
│  ✓ CORS configuration
│  ✓ Request routing
│  ✗ JWT validation (NO implementado)
└────────────┬─────────────┘
             │ Proxea request tal cual
             ▼
┌──────────────────────────┐
│  Microservicios Backend  │
│  (config, shipping, etc) │
│  - Podrían validar JWT   │
│  - Actualmente NO lo hacen
└──────────────────────────┘
```

## 📦 Dependencias Instaladas

El operator tiene dependencias de JWT/Keycloak pero NO las usa:

```json
{
  "jsonwebtoken": "^9.0.2",    // Instalado pero no usado
  "jwks-rsa": "^3.1.0"          // Instalado pero no usado
}
```

## 🔧 Configuración de Keycloak (Frontend)

El Keycloak está **completamente configurado en el frontend** (Next.js):

**Frontend env vars:**
```env
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
```

**Flujo de autenticación frontend:**
1. Usuario entra a http://localhost:3000
2. KeycloakProvider intenta login automático con Keycloak
3. Si no hay sesión → redirige a http://localhost:3000/auth/callback
4. User ingresa credenciales en Keycloak
5. Keycloak redirige a /auth/callback con authorization code
6. Frontend intercambia code por JWT token
7. Frontend guarda token en memoria/localStorage
8. Todos los requests a :3004 incluyen `Authorization: Bearer <token>`

**Configuración frontend en:** `frontend/src/app/lib/middleware/auth/`

## 📡 Variables de Entorno (Operator)

**Archivo:** `backend/services/operator-interface-service/env.example`

```env
# Puerto del servicio
PORT=3004

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:3000

# Configuración de Keycloak (DOCUMENTADA pero NO USADA)
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=ds-2025-realm

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
NODE_ENV=development
```

## ❓ ¿Se Necesita Validación JWT en el Operator?

### Escenario 1: Validación en Operator (Recomendado para Producción) ✅

**Ventajas:**
- Valida tokens JWT ANTES de rutear a microservicios
- Protege todos los endpoints contra tokens inválidos
- Reduce carga en microservicios
- Centralized security policy

**Desventajas:**
- Requiere más complejidad en operator
- Necesita cacchear JWKS de Keycloak para performance

**Implementación:**
```typescript
// 1. Crear JWT guard en operator
// 2. Registrar guard globalmente o por ruta
// 3. Validar signature del token contra JWKS de Keycloak
// 4. Pasar token al servicio backend si es válido
```

### Escenario 2: Sin Validación en Operator (Actual) ❌

**Ventajas:**
- Operator simple, solo proxy
- Microservicios pueden decidir su propia autenticación
- Desarrollo más rápido

**Desventajas:**
- Tokens inválidos pueden llegar a microservicios
- Cada microservicio necesita validación (duplicación)
- Mayor carga en microservicios

## 🚀 Recomendación para Dokploy

Para **producción en Dokploy**, recomiendo implementar validación JWT en el operator:

1. **Crear JWT Guard** en operator:
   ```bash
   nest g guard auth/jwt backend/services/operator-interface-service/src
   ```

2. **Validar tokens** contra Keycloak JWKS:
   - Cachar JWKS en memoria (refresh cada hora)
   - Validar signature y expiry del token
   - Extraer claims y pasarlos como headers a microservicios

3. **Rutas públicas** (sin autenticación):
   - `/health` - health check
   - `/gateway/status` - status de servicios
   - `/api/docs` - documentación Swagger
   - Opcionalmente: `/auth/*` - endpoints de autenticación

4. **Rutas protegidas** (requieren token):
   - `/config/*`
   - `/shipping/*`
   - `/stock/*`
   - Todo lo demás

## 📝 Próximos Pasos

Si requieres implementar JWT en el operator para Dokploy:

1. ✅ Las dependencias ya están instaladas (`jsonwebtoken`, `jwks-rsa`)
2. ⏳ Crear `src/auth/jwt.strategy.ts` para validar tokens
3. ⏳ Crear `src/auth/jwt.guard.ts` como guard de NestJS
4. ⏳ Registrar guard en `app.module.ts`
5. ⏳ Configurar rutas públicas vs protegidas
6. ⏳ Tests E2E con tokens JWT

## 🔐 Estado Actual para Dokploy

**⚠️ Importante:** El operator actualmente:
- ✅ Acepta Authorization headers y los pasa a microservicios
- ✅ Tiene CORS configurado para frontend
- ❌ NO valida tokens JWT
- ❌ NO rechaza requests sin Authorization header

**En desarrollo local:** Esto está bien (máquina local sin seguridad)
**En Dokploy (producción):** Necesitas implementar validación JWT

## 💾 Checklist para Dokploy

- [ ] Confirmar que Keycloak estará disponible en producción (misma URL o diferente)
- [ ] Actualizar `KEYCLOAK_URL` en Dokploy si es diferente
- [ ] Decidir: ¿Validar JWT en operator o dejar sin validación?
- [ ] Si sí validar: Implementar JWT guard en operator
- [ ] Si no validar: Documentar que autenticación es solo frontend

---

**Estado:** ✅ Documentado, ❌ No implementado validación en operator
**Fecha:** 2025-11-04
**Para:** Dokploy deployment
