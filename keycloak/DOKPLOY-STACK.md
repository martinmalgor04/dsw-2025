# 🚀 Desplegar Keycloak como Stack en Dokploy

Esta guía explica cómo desplegar Keycloak y PostgreSQL como un **Stack** en Dokploy usando docker-compose.

## 📋 ¿Qué es un Stack?

Un Stack en Dokploy permite desplegar múltiples servicios (como Keycloak + PostgreSQL) usando un solo `docker-compose.yml`. Esto simplifica el despliegue y la gestión de servicios relacionados.

## 🎯 Ventajas de usar Stack

- ✅ **Un solo despliegue**: Keycloak y PostgreSQL se despliegan juntos
- ✅ **Red compartida**: Los servicios se comunican automáticamente
- ✅ **Volúmenes persistentes**: Los datos se mantienen entre reinicios
- ✅ **Gestión simplificada**: Todo en un solo lugar

## 📝 Paso 1: Preparar el Repositorio

Asegúrate de que estos archivos estén en el repositorio:

```
keycloak/
├── docker-compose.yml          ← Archivo principal del stack
├── realm-config/
│   └── ds-2025-realm.json      ← Realm preconfigurado
└── env.example                 ← Variables de entorno de ejemplo
```

## 🚀 Paso 2: Crear Stack en Dokploy

### 2.1 Crear Nuevo Stack

1. En Dokploy, ir a **Stacks** → **New Stack**
2. Seleccionar **Docker Compose** como tipo

### 2.2 Configurar el Stack

- **Name**: `keycloak-stack`
- **Repository**: URL de tu repositorio (ej: `https://github.com/FRRe-DS/2025-12-TPI.git`)
- **Branch**: `dev` (o la rama que corresponda)
- **Docker Compose File**: `keycloak/docker-compose.yml`
- **Path**: `./keycloak` (opcional, si el archivo está en un subdirectorio)

### 2.3 Configurar Variables de Entorno

En la sección **Environment Variables**, agregar todas las variables necesarias:

```env
# Credenciales de administrador Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=ds2025

# Configuración del servidor Keycloak
KC_HOSTNAME=localhost
KC_HOSTNAME_PORT=8080
KC_HOSTNAME_STRICT_BACKCHANNEL=false
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT_HTTPS=false
KC_HEALTH_ENABLED=true

# Configuración de base de datos PostgreSQL
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=keycloak

# Configuración de conexión Keycloak → PostgreSQL
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=keycloak
```

**⚠️ IMPORTANTE**: 
- Cambiar `KEYCLOAK_ADMIN_PASSWORD` por una contraseña segura en producción
- Cambiar `POSTGRES_PASSWORD` por una contraseña segura
- El `KC_DB_URL` usa `postgres` como hostname (nombre del servicio en docker-compose)

### 2.4 Configurar Puertos

En Dokploy, puedes configurar qué puertos exponer:

- **PostgreSQL**: Normalmente no necesitas exponerlo públicamente (solo interno)
- **Keycloak**: Puerto `8080` (marcar como público si quieres acceso externo)

## 🚀 Paso 3: Desplegar el Stack

1. Hacer clic en **Deploy** o **Start Stack**
2. Dokploy leerá el `docker-compose.yml` y creará ambos servicios
3. Esperar a que ambos contenedores se inicien:
   - PostgreSQL se inicia primero
   - Keycloak espera a que PostgreSQL esté listo (gracias a `depends_on`)
   - El realm se importa automáticamente en el primer inicio

## ✅ Paso 4: Verificar el Despliegue

### 4.1 Verificar Servicios

En Dokploy, deberías ver dos servicios en el stack:
- `postgres` - Estado: Running
- `keycloak` - Estado: Running

### 4.2 Verificar Logs

**Logs de PostgreSQL**:
```bash
# Deberías ver mensajes de inicio de PostgreSQL
```

**Logs de Keycloak**:
```bash
# Deberías ver:
# - Conexión exitosa a PostgreSQL
# - "Importing realm from file"
# - "Realm ds-2025-realm imported"
# - Keycloak iniciado en puerto 8080
```

### 4.3 Verificar Acceso

1. **Keycloak Admin Console**: 
   - URL: `http://tu-servidor-dokploy:8080/admin`
   - Usuario: `admin`
   - Contraseña: La que configuraste en `KEYCLOAK_ADMIN_PASSWORD`

2. **Verificar Realm**:
   - En el dropdown superior izquierdo, deberías ver `ds-2025-realm`
   - Seleccionar el realm y verificar que tiene los clientes `grupo-01` a `grupo-13`

## 🔧 Configuración Avanzada

### Exponer PostgreSQL (Opcional)

Si necesitas acceso externo a PostgreSQL, puedes agregar en `docker-compose.yml`:

```yaml
postgres:
  ports:
    - "5432:5432"
```

**⚠️ No recomendado en producción** - Solo expone PostgreSQL si realmente lo necesitas.

### Cambiar Versión de PostgreSQL

En `docker-compose.yml`, puedes cambiar:

```yaml
postgres:
  image: postgres:16.2  # Cambiar a la versión que necesites
```

### Cambiar Versión de Keycloak

En `docker-compose.yml`, puedes cambiar:

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:23.0.6  # Cambiar a la versión que necesites
```

## 🔍 Troubleshooting

### Los servicios no se inician

1. **Verificar logs**: Revisar logs de ambos servicios en Dokploy
2. **Verificar variables de entorno**: Asegurarse de que todas las variables estén configuradas
3. **Verificar puertos**: Asegurarse de que el puerto 8080 no esté ocupado

### Keycloak no se conecta a PostgreSQL

1. **Verificar que PostgreSQL esté corriendo**: Ver estado en Dokploy
2. **Verificar `KC_DB_URL`**: Debe ser `jdbc:postgresql://postgres/keycloak` (usando el nombre del servicio)
3. **Verificar credenciales**: `KC_DB_USERNAME` y `KC_DB_PASSWORD` deben coincidir con `POSTGRES_USER` y `POSTGRES_PASSWORD`

### El realm no se importa

1. **Verificar que el archivo existe**: El archivo `realm-config/ds-2025-realm.json` debe estar en el repositorio
2. **Verificar logs**: Buscar mensajes de importación en los logs de Keycloak
3. **El realm solo se importa la primera vez**: Si ya existe, no se reimporta automáticamente

### Volúmenes no persisten

1. **Verificar volúmenes en Dokploy**: Los volúmenes deberían estar configurados automáticamente
2. **Verificar permisos**: Asegurarse de que los contenedores tengan permisos para escribir en los volúmenes

## 📊 Gestión del Stack

### Reiniciar el Stack

En Dokploy:
- **Restart Stack**: Reinicia todos los servicios
- **Stop Stack**: Detiene todos los servicios
- **Start Stack**: Inicia todos los servicios

### Actualizar el Stack

1. Hacer push de cambios al repositorio
2. En Dokploy, hacer clic en **Redeploy** o **Pull & Deploy**
3. Dokploy actualizará el código y reiniciará los servicios

### Eliminar el Stack

⚠️ **CUIDADO**: Esto eliminará todos los servicios y datos (a menos que tengas backups)

1. En Dokploy, ir al stack
2. **Stop Stack** (detener servicios)
3. **Delete Stack** (eliminar stack y volúmenes)

## 🔒 Seguridad en Producción

- ✅ Cambiar todas las contraseñas por valores seguros
- ✅ Usar HTTPS (configurar proxy reverso o certificado SSL)
- ✅ No exponer PostgreSQL públicamente
- ✅ Limitar acceso a la consola de administración de Keycloak
- ✅ Configurar backups regulares de PostgreSQL
- ✅ Usar variables de entorno secretas en Dokploy

## 📚 Referencias

- [Dokploy Stacks Documentation](https://dokploy.com/docs/stacks)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Keycloak Docker Documentation](https://www.keycloak.org/server/containers)

## 🎯 Resumen

Con este stack, tienes:
- ✅ **PostgreSQL** corriendo y gestionado automáticamente
- ✅ **Keycloak** conectado a PostgreSQL
- ✅ **Realm preconfigurado** importado automáticamente
- ✅ **Todo en un solo despliegue** fácil de gestionar

¡Tu Keycloak está listo para usar! 🚀

