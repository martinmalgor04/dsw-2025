# 🔧 Solucionar Redirección a localhost:8080 en Keycloak

## Problema

Cuando intentas hacer login en Keycloak desplegado en Dokploy, te redirige a `localhost:8080` en lugar de la URL real del servicio.

## Causa

Keycloak está configurado con `KC_HOSTNAME=localhost`, lo que hace que genere URLs de redirección usando `localhost` en lugar de la URL real donde está desplegado.

## Solución Rápida

### Paso 1: Encontrar la URL de tu Keycloak en Dokploy

1. Ve a tu stack en Dokploy
2. Busca la URL pública o dominio asignado
3. Anota la URL completa (ej: `https://keycloak.tu-servidor.com` o `http://192.168.1.100:8080`)

### Paso 2: Actualizar Variables de Entorno en Dokploy

Ve a tu stack en Dokploy → **Environment Variables** y actualiza:

#### Si tienes dominio/HTTPS:
```env
KC_HOSTNAME=keycloak.tu-servidor.com
KC_HOSTNAME_PORT=443
KC_HOSTNAME_STRICT_HTTPS=true
KC_HOSTNAME_STRICT=true
```

#### Si usas IP/Puerto HTTP:
```env
KC_HOSTNAME=192.168.1.100
KC_HOSTNAME_PORT=8080
KC_HOSTNAME_STRICT_HTTPS=false
KC_HOSTNAME_STRICT=false
```

#### Si Dokploy usa proxy reverso (Recomendado):
```env
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HTTP_RELATIVE_PATH=/
```

**⚠️ IMPORTANTE**: Reemplaza `keycloak.tu-servidor.com` o `192.168.1.100` con la URL real de tu Keycloak en Dokploy.

### Paso 3: Reiniciar el Stack

1. Guarda las variables de entorno
2. En Dokploy, haz clic en **Restart Stack** o **Redeploy**
3. Espera a que Keycloak se reinicie

### Paso 4: Verificar

1. Accede a la URL de Keycloak
2. Intenta hacer login
3. Ahora debería redirigir correctamente a la URL real en lugar de localhost

## Solución Alternativa: Desactivar Hostname Strict

Si no puedes configurar un hostname específico, puedes desactivar la validación estricta:

```env
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false
KC_PROXY=edge
```

Esto permite que Keycloak use el hostname de la solicitud HTTP en lugar de un hostname fijo.

## Verificar Configuración Actual

Para ver qué hostname está usando Keycloak actualmente:

1. Accede a la consola de administración
2. Ve a **Realm Settings** → **General**
3. Busca **Frontend URL** - debería mostrar la URL correcta

O revisa los logs de Keycloak:
```bash
# En los logs deberías ver el hostname configurado
```

## Troubleshooting

### Sigue redirigiendo a localhost después de cambiar

1. **Verificar que las variables se guardaron**: Revisa en Dokploy que las variables estén correctas
2. **Reiniciar completamente**: Stop stack → Start stack
3. **Limpiar caché del navegador**: Cierra y vuelve a abrir el navegador
4. **Verificar logs**: Busca errores relacionados con hostname en los logs

### No sé cuál es mi URL en Dokploy

1. Ve a la configuración del stack en Dokploy
2. Busca la sección de **Networking** o **Exposed Ports**
3. Deberías ver la URL pública o IP asignada
4. Si no aparece, consulta la documentación de Dokploy sobre cómo obtener la URL pública

### Usar proxy reverso (Nginx/Traefik)

Si tienes un proxy reverso delante de Keycloak:

```env
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
```

Y configura el proxy para pasar el header `X-Forwarded-Host` correctamente.

## Referencias

- [Keycloak Hostname Configuration](https://www.keycloak.org/server/hostname)
- [Keycloak Proxy Settings](https://www.keycloak.org/server/reverseproxy)

