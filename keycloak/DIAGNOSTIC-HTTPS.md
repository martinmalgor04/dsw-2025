# 🔍 Diagnóstico: Error "HTTPS required" en Keycloak

## Checklist de Verificación

### 1. Verificar Variables de Entorno en Dokploy

**En Dokploy, ve a tu stack → Environment Variables y verifica que tengas:**

```env
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false
```

**✅ Debe estar presente:**
- [ ] `KC_PROXY=edge` (CRÍTICO - sin esto no funcionará)

**❌ No debe estar:**
- [ ] `KC_HOSTNAME_STRICT=true` (debe ser `false`)
- [ ] `KC_HOSTNAME_STRICT_HTTPS=true` (debe ser `false`)

### 2. Verificar que las Variables se Aplicaron

**En Dokploy:**
1. Ve a tu stack
2. Click en el servicio `keycloak`
3. Ve a **Logs**
4. Busca en los logs al inicio mensajes como:
   ```
   KC_PROXY set to edge
   ```
   o
   ```
   Proxy mode: edge
   ```

**Si NO ves referencias a `proxy` o `edge` en los logs**, las variables no se están aplicando.

### 3. Verificar Variables Dentro del Contenedor

Si tienes acceso SSH al servidor de Dokploy, puedes verificar:

```bash
# Conectarse al contenedor de Keycloak
docker exec -it <nombre-contenedor-keycloak> env | grep KC_PROXY

# Debería mostrar:
KC_PROXY=edge
```

### 4. Verificar Logs de Inicio

**En los logs de Keycloak, busca:**

**✅ Mensajes correctos:**
```
Proxy mode: edge
HTTP enabled: true
Hostname strict: false
```

**❌ Mensajes problemáticos:**
```
HTTPS required
Hostname strict enabled
```

### 5. Verificar que el Stack se Reinició

**Después de agregar/modificar variables:**
1. ¿Hiciste **Restart** o **Reload** del stack?
2. ¿El contenedor de Keycloak se reinició? (revisa los timestamps en los logs)
3. ¿Hay mensajes de inicio recientes en los logs?

## Soluciones por Problema Encontrado

### Problema: KC_PROXY no está en las variables

**Solución:**
1. Agrega `KC_PROXY=edge` en Dokploy
2. Guarda
3. Reinicia el stack

### Problema: Las variables están pero no se aplican

**Posibles causas:**
1. El stack no se reinició después de agregar las variables
2. El docker-compose.yml no tiene `${KC_PROXY}` configurado

**Solución:**
1. Verifica que el `docker-compose.yml` tenga:
   ```yaml
   KC_PROXY: ${KC_PROXY:-edge}
   ```
2. Si no está, necesitas hacer **Rebuild** del stack (no solo restart)

### Problema: KC_PROXY está pero sigue el error

**Prueba estas configuraciones alternativas:**

#### Opción A: Configuración más permisiva
```env
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false
KC_HOSTNAME_STRICT_HTTPS=false
KC_HOSTNAME_STRICT=false
```

#### Opción B: Configuración con hostname específico
```env
KC_PROXY=edge
KC_HOSTNAME=144.22.130.30
KC_HOSTNAME_PORT=8080
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false
```

#### Opción C: Desactivar completamente HTTPS requirement
```env
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HOSTNAME_STRICT_HTTPS=false
# Esta variable puede no existir en Keycloak 23.0.6, pero prueba
KC_HTTPS_REQUIRED=false
```

### Problema: Dokploy usa un proxy diferente

**Si Dokploy usa Traefik o Nginx, puede necesitar:**

```env
KC_PROXY=edge
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_PROXY_ADDRESS_FORWARDING=true
```

## Verificación Final

**Después de aplicar los cambios:**

1. **Reinicia el stack completamente**: Stop → Start
2. **Espera 1-2 minutos** para que Keycloak inicie
3. **Revisa los logs** - busca errores relacionados con HTTPS
4. **Intenta acceder** a Keycloak
5. **Si sigue fallando**, comparte los logs de inicio de Keycloak

## Información para Debugging

**Si necesitas ayuda adicional, comparte:**

1. **Variables de entorno actuales** (sin passwords)
2. **Primeras 50 líneas de los logs** de Keycloak al iniciar
3. **URL exacta** donde accedes a Keycloak
4. **Versión de Keycloak**: 23.0.6 (según docker-compose.yml)

## Comandos Útiles para Debugging

```bash
# Ver todas las variables de entorno del contenedor
docker exec <keycloak-container> env | grep KC_

# Ver logs completos
docker logs <keycloak-container> --tail 100

# Verificar configuración de proxy
docker exec <keycloak-container> cat /opt/keycloak/conf/keycloak.conf | grep -i proxy
```


