# 🔒 Solucionar Error "HTTPS required" en Keycloak

## Problema

Cuando intentas acceder a Keycloak en Dokploy, aparece el error:
```
We are sorry...
HTTPS required
```

## Causa

Keycloak está detectando que está detrás de un proxy reverso con HTTPS (como Dokploy), pero no está configurado para trabajar en modo proxy. Keycloak necesita saber que está detrás de un proxy para manejar correctamente las solicitudes HTTPS.

## Solución Rápida

### Actualizar Variables de Entorno en Dokploy

Agrega estas variables a tu stack en Dokploy:

```env
# Configuración para proxy HTTPS (CRÍTICO)
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false

# Tu configuración existente
KC_HOSTNAME=144.22.130.30
KC_HOSTNAME_PORT=8080
```

**La variable más importante es `KC_PROXY=edge`** - esto le dice a Keycloak que está detrás de un proxy edge (como Traefik, Nginx, o el proxy de Dokploy).

## Configuración Completa Recomendada

Para Dokploy con proxy HTTPS, usa esta configuración completa:

```env
# Credenciales
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=ds2025

# Configuración de proxy HTTPS
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false

# Hostname (opcional, pero recomendado)
KC_HOSTNAME=144.22.130.30
KC_HOSTNAME_PORT=8080

# Base de datos
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=keycloak
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=keycloak
```

## Pasos

1. **Agregar `KC_PROXY=edge`** en las variables de entorno de Dokploy
2. **Guardar** las variables
3. **Restart** el stack (no rebuild necesario si solo cambias variables)
4. **Probar** accediendo a Keycloak nuevamente

## ¿Qué hace KC_PROXY=edge?

- `edge`: Keycloak está detrás de un proxy edge (termina SSL/TLS en el proxy)
- Le dice a Keycloak que confíe en los headers `X-Forwarded-*` del proxy
- Permite que Keycloak funcione correctamente con HTTPS aunque internamente use HTTP

## Valores de KC_PROXY

- `edge`: Proxy edge (termina SSL en el proxy) - **Recomendado para Dokploy**
- `reencrypt`: Proxy que re-encripta
- `passthrough`: Proxy que pasa todo
- `none`: Sin proxy (solo para desarrollo local)

## Troubleshooting

### Sigue apareciendo el error después de agregar KC_PROXY

1. **Verificar que la variable se guardó**: Revisa en Dokploy que `KC_PROXY=edge` esté presente
2. **Reiniciar completamente**: Stop → Start del stack
3. **Verificar logs**: Busca errores relacionados con proxy en los logs de Keycloak

### Error "Invalid redirect URI"

Si después de agregar `KC_PROXY` aparece este error, puede ser que necesites actualizar los Valid Redirect URIs en el realm para usar HTTPS.

## Referencias

- [Keycloak Proxy Settings](https://www.keycloak.org/server/reverseproxy)
- [Keycloak Hostname Configuration](https://www.keycloak.org/server/hostname)

