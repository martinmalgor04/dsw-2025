# Fix: Variables de Entorno Frontend - Keycloak No Redirige

## 🔴 Problema

Frontend se despliega pero Keycloak no redirige a login. Console muestra warnings de variables de entorno no definidas.

## 🔍 Diagnóstico

Tu env actual:
```env
NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar/operator-interface-service  ❌ INCORRECTO
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar                         ⚠️ REVISAR
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm                                         ✅
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=grupo-02                                          ✅ (pero docs dicen logix-frontend)
NEXT_PUBLIC_ENV=production                                                        ✅
```

## 🔧 Correcciones Necesarias

### 1. **NEXT_PUBLIC_API_URL** (CRÍTICO)

**Actual (❌ incorrecto):**
```env
NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar/operator-interface-service
```

**Debería ser:**
```env
NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar:3004
```

**Razón:** El operator gateway corre en puerto 3004, no hay ruta `/operator-interface-service`

---

### 2. **NEXT_PUBLIC_KEYCLOAK_URL** (CRÍTICO)

**Actual (⚠️ problema potencial):**
```env
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
```

**Checklist:**

- [ ] ¿Keycloak está desplegado en `keycloak.mmalgor.com.ar`?
- [ ] ¿Está accesible públicamente? Prueba: `curl https://keycloak.mmalgor.com.ar`
- [ ] ¿Tiene certificado SSL válido?
- [ ] ¿El realm `ds-2025-realm` existe?

**Si NO está en HTTPS:**
```env
NEXT_PUBLIC_KEYCLOAK_URL=http://keycloak.mmalgor.com.ar:8080
```

**Si está en HTTP pero expuesto en HTTPS por proxy:**
```env
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
```

---

### 3. **NEXT_PUBLIC_KEYCLOAK_CLIENT_ID** (REVISAR)

**Actual:**
```env
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=grupo-02
```

**Debería ser (según docs):**
```env
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
```

**Verifica en Keycloak admin console:**
- Realm: `ds-2025-realm`
- Clients: ¿existe `logix-frontend`? ¿o `grupo-02`?

---

## 📋 Env Correcto para Dokploy

```env
# Puerto (no cambiar)
PORT=3005

# API Gateway (CAMBIAR)
NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar:3004

# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=http://logistica.mmalgor.com.ar:3005

# Keycloak (REVISAR)
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend

# Environment
NEXT_PUBLIC_ENV=production
```

---

## 🧪 Cómo Debuggear

### 1. Verifica que Keycloak es accesible

```bash
# Desde tu máquina
curl -I https://keycloak.mmalgor.com.ar
curl -I https://keycloak.mmalgor.com.ar/realms/ds-2025-realm

# Debería retornar 200 o 301
```

### 2. Verifica que el client existe

```bash
# Desde Keycloak admin console
# https://keycloak.mmalgor.com.ar/admin/master/console/

# Realm: ds-2025-realm
# Clients: busca logix-frontend (o grupo-02)

# Si existe, verifica:
# - Client ID: logix-frontend (o grupo-02)
# - Redirect URIs: http://logistica.mmalgor.com.ar:3005/auth/callback
# - Valid POST Logout Redirect URIs: http://logistica.mmalgor.com.ar:3005
```

### 3. Verifica que Operator está accesible

```bash
curl http://logistica.mmalgor.com.ar:3004/health

# Debería retornar:
# {"status":"ok",...}
```

### 4. Abre DevTools en frontend y busca:

En **Network tab:**
- ¿Request a `/auth/callback`? ¿Qué status code?
- ¿Request a Keycloak? ¿Error CORS?

En **Console:**
- Busca errores sobre Keycloak
- Busca warnings sobre variables de entorno

---

## 🚀 Pasos a Seguir

1. **Actualiza el env en Dokploy:**
   ```env
   NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar:3004
   NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
   ```

2. **Redeploy frontend en Dokploy**

3. **Verifica en DevTools Console:**
   - No deberían aparecer warnings sobre variables no definidas
   - Debería intentar redirigir a Keycloak

4. **Si sigue sin funcionar:**
   - Comparte output de: `curl -I https://keycloak.mmalgor.com.ar`
   - Comparte error exacto de console
   - Comparte Network tab cuando hace click en login

---

## ⚠️ Problema Común: CORS en Keycloak

Si ves error `CORS` en console, Keycloak no acepta requests desde `logistica.mmalgor.com.ar`.

**Solución en Keycloak admin:**
1. Realm: `ds-2025-realm`
2. Clients: `logix-frontend`
3. Settings:
   - Web Origins: `http://logistica.mmalgor.com.ar:3005`
   - Redirect URIs: `http://logistica.mmalgor.com.ar:3005/auth/callback`

---

## 📝 Checklist

- [ ] Keycloak accesible en `https://keycloak.mmalgor.com.ar`
- [ ] Realm `ds-2025-realm` existe
- [ ] Client `logix-frontend` existe (o es `grupo-02`?)
- [ ] NEXT_PUBLIC_API_URL = `http://logistica.mmalgor.com.ar:3004` (sin /operator-interface-service)
- [ ] NEXT_PUBLIC_KEYCLOAK_URL = `https://keycloak.mmalgor.com.ar`
- [ ] NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = `logix-frontend` (o verifica cuál es)
- [ ] Frontend redeployed en Dokploy
- [ ] Console sin warnings de variables
- [ ] Click en Login intenta redirigir a Keycloak

---

**Cuéntame:**
1. ¿Keycloak está desplegado? ¿Dónde?
2. ¿El client es `logix-frontend` o `grupo-02`?
3. ¿Qué error exacto ves cuando haces click en login?
