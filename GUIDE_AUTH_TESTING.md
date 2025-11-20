# Guía de Autenticación y Testing Manual

Esta guía explica cómo obtener un token JWT (Access Token) desde tu Keycloak en producción y cómo usarlo para probar los endpoints protegidos del Gateway local.

## 1. Configuración de Keycloak

*   **URL:** `https://keycloak.mmalgor.com.ar`
*   **Realm:** `ds-2025-realm`
*   **Client ID:** `grupo-12` (Asegúrate que este cliente exista y sea "Public" o tenga "Direct Access Grants" habilitado si usas usuario/password, o usa el flujo de navegador).

## 2. Obtener Token vía CURL (Rápido)

Si tu cliente permite "Direct Access Grants" (Login con usuario y contraseña directa), usa este comando en tu terminal. Reemplaza `<TU_USUARIO>` y `<TU_PASSWORD>` con tus credenciales de Keycloak.

```bash
curl -X POST https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=grupo-02" \
  -d "username=test-user" \
  -d "password=12deboca" \
  -d "grant_type=password"
```

**Respuesta esperada:**
Recibirás un JSON. Copia el valor de `"access_token"`. Es un string largo que empieza con `eyJ...`.

> **Nota:** Si recibes error de "Client not allowed", significa que tu cliente en Keycloak no permite `Direct Access Grants` o requiere `client_secret`. En ese caso, usa el método de Postman.

## 3. Obtener Token vía Postman (Recomendado)

1.  Crea una nueva Request en Postman.
2.  Ve a la pestaña **Authorization**.
3.  Tipo: **OAuth 2.0**.
4.  Configura lo siguiente:
    *   **Grant Type:** Authorization Code (o Password Credentials si está habilitado).
    *   **Callback URL:** `http://localhost:3000` (o lo que tengas configurado en Keycloak).
    *   **Auth URL:** `https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/auth`
    *   **Access Token URL:** `https://keycloak.mmalgor.com.ar/realms/ds-2025-realm/protocol/openid-connect/token`
    *   **Client ID:** `grupo-12`
    *   **Client Secret:** (Déjalo vacío si el cliente es Público, pon el secreto si es Confidencial).
    *   **Scope:** `openid profile email`
5.  Haz clic en **Get New Access Token**.
6.  Se abrirá una ventana para loguearte en tu Keycloak. Logueate.
7.  Postman capturará el token. Haz clic en **Use Token**.

## 4. Dónde poner el Token

Una vez tengas el token (digamos que es `eyJhbGci...`), úsalo para llamar a tu API local (Gateway).

### En CURL:
Usa el header `-H "Authorization: Bearer <TOKEN>"`.

**Ejemplo: Probar Endpoint Protegido (Tracking)**
```bash
curl -X POST http://localhost:3004/api/logistics/tracking \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1001,
    "address": "Calle Falsa 123, Ciudad",
    "products": [{"id": 1, "quantity": 2}]
  }'
```

### En Postman:
1.  En la pestaña **Authorization** de la request.
2.  Tipo: **Bearer Token**.
3.  Pega el token en el campo **Token**.

## 5. Endpoints para Probar

*   **Públicos (No requieren token):**
    *   `GET http://localhost:3004/health`
    *   `GET http://localhost:3004/gateway/status`

*   **Protegidos (Requieren Token):**
    *   `GET http://localhost:3004/config/transport-methods`
    *   `POST http://localhost:3004/shipping/cost` (Cálculo de costos)
    *   `POST http://localhost:3004/shipping` (Crear envío interno)
    *   `POST http://localhost:3004/api/logistics/tracking` (Crear envío desde Compras - Simulado)
    *   `GET http://localhost:3004/stock/productos/1` (Ver stock real)

