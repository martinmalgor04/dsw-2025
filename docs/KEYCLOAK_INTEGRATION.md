# 🔐 Integración de Keycloak en TPI

## Resumen de la Integración

Este documento describe cómo Keycloak se ha integrado en el sistema de logística para proporcionar autenticación y autorización seguras mediante OAuth 2.0 / OpenID Connect.

**Versión:** 1.0
**Última actualización:** Noviembre 2025
**Estado:** ✅ Implementado

---

## Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Componentes Implementados](#componentes-implementados)
3. [Flujo de Autenticación](#flujo-de-autenticación)
4. [Configuración](#configuración)
5. [Variables de Entorno](#variables-de-entorno)
6. [JWT Guard - Validación en Backend](#jwt-guard---validación-en-backend)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Arquitectura

### Diagrama General

```
┌─────────────┐
│  Navegador  │
│ (Usuario)   │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                       │
       ▼                                       ▼
┌───────────────┐                     ┌──────────────────┐
│   Frontend    │◄───────────────────►│    Keycloak      │
│  (Next.js)    │ OAuth2/OIDC          │ (Autenticación)  │
└───────┬───────┘                     └──────────────────┘
        │
        │ GET /config (con JWT)
        │
        ▼
┌───────────────────────┐
│  Operator Gateway     │
│   (JWT Guard)         │ ◄─── Valida tokens JWT
│ (Port 3004)           │
└───────┬───────────────┘
        │
        ├─────────────┬─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
  Config Svc   Shipping Svc  Stock Svc    Health Svc
  (Port 3003)  (Port 3001)  (Port 3002)
```

### Flujo de Seguridad

```
1. Frontend Login
   ↓
2. Keycloak Auth → Devuelve JWT Token
   ↓
3. Frontend guarda JWT en localStorage
   ↓
4. Frontend envía JWT en header Authorization: Bearer <token>
   ↓
5. Operator Gateway (JwtGuard)
   - Extrae token del header
   - Obtiene claves públicas del JWKS endpoint de Keycloak
   - Valida la firma del token (RS256)
   - Valida que el token no esté expirado
   - Adjunta claims del usuario al request
   ↓
6. Request válido → Proxea a microservicio
7. Request inválido → 401 Unauthorized
```

---

## Componentes Implementados

### 1. Backend - JWT Guard (Operator Interface Service)

**Ubicación:** `backend/services/operator-interface-service/src/auth/`

#### Archivos creados:

- **`auth.guard.ts`** - Guard que valida JWT de Keycloak
  - Extrae tokens del header `Authorization: Bearer <token>`
  - Obtiene claves públicas del JWKS endpoint
  - Valida firma (RS256) y expiración
  - Adjunta user claims al request

- **`auth.module.ts`** - Módulo que exporta el JwtGuard
  - Proporciona el guard globalmente a la aplicación
  - Registrado como `APP_GUARD` en `app.module.ts`

- **`auth.types.ts`** - Tipos TypeScript para JWT
  - Define interfaz `JwtPayload` con estructura de claims
  - Extiende `Express.Request` con propiedad `user`

#### Rutas Excluidas de Validación:

Por defecto, el JwtGuard **no valida**:
- `/health` - Health checks de servicios
- `/api/*` - Documentación Swagger/OpenAPI
- `/gateway/status` - Status del gateway

Todos los demás endpoints requieren un JWT válido.

### 2. Frontend - Keycloak Provider

**Ubicación:** `frontend/src/app/lib/middleware/auth/`

Ya existía, pero fue actualizado para usar URL de Keycloak en producción:

- **`keycloak.config.ts`** - Configuración de cliente Keycloak
- **`KeycloakProvider.tsx`** - Provider React que maneja autenticación
- **Env config** - Variables de entorno desde `frontend/src/app/lib/config/env.config.ts`

### 3. Realm Keycloak

**Ubicación:** `keycloak/realm-config/ds-2025-realm.json`

**Ya configurado con:**
- ✅ Clientes para grupos (grupo-01 a grupo-13)
- ✅ Cliente público `grupo-02` para el frontend
- ✅ Scopes de negocio (usuarios, compras, stock, envíos, etc.)
- ✅ Roles de backend (compras-be, stock-be, logistica-be)
- ✅ Usuario de prueba (test-user@gmail.com)

---

## Flujo de Autenticación

### 1. Usuario Accede a la Aplicación

```
Usuario accede a http://localhost:3000
```

### 2. Frontend Detecta Falta de Sesión

```javascript
// En KeycloakProvider.tsx
const keycloak = initializeKeycloak();
await keycloak.init({ onLoad: 'login-required' });

if (!keycloak.authenticated) {
  // Redirige a /auth/callback para iniciar login
}
```

### 3. Keycloak Redirige a Login

```
http://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/auth?
  client_id=grupo-02&
  redirect_uri=http://localhost:3000/auth/callback&
  response_type=code&
  ...
```

### 4. Usuario Ingresa Credenciales

```
Email: test@gmail.com
Password: (verificado en Keycloak)
```

### 5. Keycloak Redirige con Authorization Code

```
http://localhost:3000/auth/callback?code=<authorization_code>
```

### 6. Frontend Intercambia Código por JWT

```bash
POST http://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/token
  grant_type=authorization_code
  code=<authorization_code>
  client_id=grupo-02
  redirect_uri=http://localhost:3000/auth/callback
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 300,
  "refresh_token": "..."
}
```

### 7. Frontend Almacena y Usa JWT

```javascript
// Almacenar en localStorage
localStorage.setItem('keycloak_token', access_token);

// Enviar en requests
fetch('http://localhost:3004/config/transport-methods', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
})
```

### 8. Operator Gateway Valida JWT

```
1. Extrae token de header
2. Obtiene kid (Key ID) del header del token
3. Solicita clave pública a:
   GET https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/certs
4. Verifica firma con clave pública
5. Valida issuer = https://keycloak.mmalgor.com.ar/realms/ds-2025-realm
6. Valida que no esté expirado
7. Si todo OK: adjunta user claims al request
8. Si falla: retorna 401 Unauthorized
```

### 9. Request Continúa a Microservicio

```
✅ JWT válido:
POST /config/transport-methods
Authorization: Bearer <token>
→ 200 OK (respuesta del microservicio)

❌ JWT inválido:
POST /config/transport-methods
Authorization: Bearer <token_inválido>
→ 401 Unauthorized
```

---

## Configuración

### Docker Compose

En `docker-compose.yml`, las variables de Keycloak están configuradas:

```yaml
# Operator Gateway - Valida JWT
environment:
  KEYCLOAK_URL: https://keycloak.mmalgor.com.ar
  KEYCLOAK_REALM: ds-2025-realm

# Frontend - Autentica usuarios
environment:
  NEXT_PUBLIC_KEYCLOAK_URL: https://keycloak.mmalgor.com.ar
  NEXT_PUBLIC_KEYCLOAK_REALM: ds-2025-realm
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: grupo-02
```

### Desarrollo Local

Para desarrollo local con Keycloak en `http://localhost:8080`, usa:

```bash
# Levantar Keycloak localmente
cd keycloak
docker-compose up -d

# En .env.local del operator (opcional, usa default):
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=ds-2025-realm

# En .env.local del frontend:
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=grupo-02
```

---

## Variables de Entorno

### Frontend (.env.local o Dokploy)

```env
# Keycloak - Autenticación de usuarios
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=grupo-02
```

**Notas:**
- Todas deben comenzar con `NEXT_PUBLIC_` para exponerse al navegador
- Se compilan en build time, no en runtime
- Se definen en Dokploy en la sección "Build Environment Variables"

### Backend - Operator Interface Service (.env.local o Dokploy)

```env
# Keycloak - Validación JWT
KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
KEYCLOAK_REALM=ds-2025-realm
```

**Notas:**
- No requieren prefijo `NEXT_PUBLIC_` (no se exponen al cliente)
- Se definen en Dokploy en la sección "Environment Variables"

---

## JWT Guard - Validación en Backend

### Cómo Funciona

El `JwtGuard` en `backend/services/operator-interface-service/src/auth/auth.guard.ts`:

1. **Implementa `CanActivate`** de NestJS
2. **Se registra globalmente** como `APP_GUARD` en `app.module.ts`
3. **Se ejecuta antes** de cada request (excepto rutas públicas)
4. **Valida la firma** del JWT usando claves públicas de Keycloak
5. **Adjunta `request.user`** con claims decodificados

### Estructura de user en request

```typescript
// Acceso en controladores
constructor(private logger: Logger) {}

async myMethod(@Req() req: Request) {
  const user = req.user; // Tipo JwtPayload

  console.log(user.sub);      // ID único del usuario
  console.log(user.username); // Usuario preferido
  console.log(user.roles);    // Roles del usuario
  console.log(user.scopes);   // Scopes solicitados
}
```

### Validación Detallada

```typescript
// En auth.guard.ts, método canActivate():

1. Extrae token del header Authorization: Bearer <token>
   ✅ Si no existe → UnauthorizedException

2. Decodifica token sin validar para obtener el kid
   ✅ Si falla → UnauthorizedException

3. Obtiene clave pública usando el kid
   GET https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/certs
   ✅ Si falla → Log y UnauthorizedException

4. Verifica firma con RS256
   jwt.verify(token, publicKey, { algorithms: ['RS256'] })
   ✅ Si falla → UnauthorizedException

5. Valida issuer
   issuer = https://keycloak.mmalgor.com.ar/realms/ds-2025-realm
   ✅ Si no coincide → UnauthorizedException

6. Valida que no esté expirado
   ✅ Si está expirado → UnauthorizedException

7. Adjunta claims al request
   request.user = { sub, username, email, roles, scopes, ... }
```

### Rutas Públicas (Sin Validación JWT)

```typescript
const skipPaths = [
  '/health',      // Health checks
  '/api/',        // Swagger/OpenAPI docs
  '/gateway/status' // Status del gateway
];
```

Para agregar más rutas públicas, edita `skipPaths` en `auth.guard.ts`:

```typescript
const skipPaths = [
  '/health',
  '/api/',
  '/gateway/status',
  '/public/endpoint' // Nueva ruta pública
];
```

---

## Testing

### Obtener un JWT Token (Manual)

#### Opción 1: Desde la Consola Keycloak

```bash
# Acceder a http://keycloak.mmalgor.com.ar/admin
# Usuario: admin
# Contraseña: ds2025

# Ir a Realm: ds-2025-realm
# → Clients → grupo-02
# → Credentials tab
# → Copiar Client Secret

# Luego ejecutar:
curl --location 'https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=grupo-02' \
  --data-urlencode 'client_secret=<CLIENT_SECRET>'
```

#### Opción 2: Login de Usuario

```bash
# En navegador, acceder a:
https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/auth?
  client_id=grupo-02&
  redirect_uri=http://localhost:3000/auth/callback&
  response_type=code

# Usar credenciales:
# Email: test@gmail.com
# (se obtiene el JWT en /auth/callback)
```

### Probar JWT en el Gateway

```bash
TOKEN="eyJhbGciOiJSUzI1NiIs..."

# Request CON JWT válido
curl --header "Authorization: Bearer $TOKEN" \
  http://localhost:3004/config/transport-methods

# Response: 200 OK con datos

# Request SIN JWT
curl http://localhost:3004/config/transport-methods

# Response: 401 Unauthorized
```

### Logs del JwtGuard

El guard loguea en cada validación:

```
✅ JWT validado para usuario@email.com - GET /config/transport-methods
❌ No token provided for POST /config/vehicle-types
❌ Token inválido para GET /config/coverage-zones
❌ JWT expirado para DELETE /config/tariff-configs
```

---

## Troubleshooting

### Problema: 401 Unauthorized en todos los requests

**Causa posible:** Keycloak URL incorrecta o no accesible

**Solución:**

```bash
# Verificar que Keycloak responda
curl https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/.well-known/openid-configuration

# Debe devolver configuración OIDC
```

### Problema: JWT expirado después de 5 minutos

**Causa:** Tokens de Keycloak expiran (por defecto 5 min)

**Solución en Frontend:**

```javascript
// El frontend debe usar refresh tokens
// KeycloakProvider ya maneja esto automáticamente
// Si no funciona, revisar:
// 1. Refresh token está en localStorage
// 2. Keycloak permite refresh tokens (está habilitado por defecto)
```

### Problema: JWKS endpoint lento

**Causa:** Primera vez que se obtienen las claves públicas

**Solución:** El guard cachea las claves por 10 minutos

```typescript
new JwksClient({
  jwksUri,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000 // 10 minutos
})
```

### Problema: Frontend no se autentica

**Causas posibles:**

1. NEXT_PUBLIC_KEYCLOAK_URL incorrecta
   ```bash
   # Verificar en navegador
   console.log(process.env.NEXT_PUBLIC_KEYCLOAK_URL)
   ```

2. NEXT_PUBLIC_KEYCLOAK_CLIENT_ID no registrado en Keycloak
   ```bash
   # Verificar en Admin Console
   # Realm → Clients → grupo-02
   ```

3. Redirect URI no autorizado
   ```bash
   # En Admin Console, verificar:
   # Cliente → Settings → Valid Redirect URIs
   # Debe incluir: http://localhost:3000/*
   ```

### Problema: CORS error en navegador

**Causa:** Keycloak no permite el origen del frontend

**Solución:**

```bash
# En Admin Console → Realm Settings → CORS
# Agregar el origen del frontend en "Web Origins"
# Por ejemplo: http://localhost:3000
```

---

## Next Steps / Mejoras Futuras

- [ ] Implementar Rate Limiting basado en usuario (del JWT)
- [ ] Agregar logging de auditoría (quién accedió a qué)
- [ ] Implementar Roles-Based Access Control (RBAC) en microservicios
- [ ] Agregar soporte para Multiple Realms
- [ ] Implementar Token Revocation en logout
- [ ] Agregar Cache de roles/permisos con TTL

---

## Referencias

- **Keycloak Docs:** https://www.keycloak.org/documentation
- **OpenID Connect:** https://openid.net/connect/
- **RFC 6749 (OAuth2):** https://tools.ietf.org/html/rfc6749
- **JWT (RFC 7519):** https://tools.ietf.org/html/rfc7519
- **NestJS Guards:** https://docs.nestjs.com/guards
