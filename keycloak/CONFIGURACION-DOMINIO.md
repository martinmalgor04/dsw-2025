# 🌐 Configuración de Keycloak con Dominio Personalizado

## Configuración de Variables de Entorno para Dominio

Si tienes un dominio configurado (ej: `keycloak.mmalgor.com.ar`), usa esta configuración:

```env
# Configuración del servidor Keycloak con dominio
KC_HOSTNAME=keycloak.mmalgor.com.ar
KC_HOSTNAME_PORT=443
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false
KC_PROXY_ADDRESS_FORWARDING=true

# Resto de la configuración
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=ds2025

# PostgreSQL
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=keycloak
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=keycloak
```

## ⚠️ Importante: Actualizar Redirect URIs en el Realm

Después de configurar el dominio, **debes actualizar los Valid Redirect URIs** en Keycloak:

### Paso 1: Acceder a Keycloak Admin Console

1. Accede a: `https://keycloak.mmalgor.com.ar/admin`
2. Login con tus credenciales de admin

### Paso 2: Actualizar el Cliente grupo-02

1. Ve a **Clients** → `grupo-02`
2. En **Valid Redirect URIs**, agrega:
   ```
   https://keycloak.mmalgor.com.ar/*
   https://keycloak.mmalgor.com.ar/auth/callback
   ```
3. En **Web Origins**, agrega:
   ```
   https://keycloak.mmalgor.com.ar
   ```
4. En **Base URL**, cambia a:
   ```
   https://keycloak.mmalgor.com.ar
   ```
5. Guarda los cambios

### Paso 3: Actualizar Frontend

Si tu frontend también usa Keycloak, actualiza las variables de entorno:

```env
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=grupo-02
```

## Configuración Completa Recomendada

### Para HTTPS con Dominio:

```env
# Hostname (dominio)
KC_HOSTNAME=keycloak.mmalgor.com.ar
KC_HOSTNAME_PORT=443

# Proxy (CRÍTICO para HTTPS)
KC_PROXY=edge
KC_PROXY_ADDRESS_FORWARDING=true

# Configuración de hostname
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false

# HTTP habilitado (internamente, el proxy maneja HTTPS)
KC_HTTP_ENABLED=true
```

### Para HTTP con Dominio (solo desarrollo):

```env
KC_HOSTNAME=keycloak.mmalgor.com.ar
KC_HOSTNAME_PORT=80
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
```

## Verificación

Después de configurar:

1. ✅ **Accede a**: `https://keycloak.mmalgor.com.ar`
2. ✅ **Deberías ver**: La página de login de Keycloak (no el error "HTTPS required")
3. ✅ **Admin Console**: `https://keycloak.mmalgor.com.ar/admin`
4. ✅ **Logs**: No deberían mostrar errores de HTTPS

## Troubleshooting

### Sigue apareciendo "HTTPS required"

1. Verifica que `KC_PROXY=edge` esté configurado
2. Verifica que `KC_PROXY_ADDRESS_FORWARDING=true` esté configurado
3. Reinicia el stack completamente
4. Verifica los logs de Keycloak

### Redirect URIs no funcionan

1. Asegúrate de haber actualizado los Valid Redirect URIs en el cliente
2. Verifica que uses `https://` (no `http://`)
3. Verifica que el dominio esté escrito correctamente

### El dominio no resuelve

1. Verifica la configuración DNS del dominio
2. Verifica que el proxy de Dokploy esté configurado para el dominio
3. Verifica que el certificado SSL esté configurado en Dokploy

