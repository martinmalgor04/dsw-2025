# 🚀 DEPLOY EN PORTAINER - Guía Completa

## 📋 PASOS PARA DEPLOY EN PORTAINER

### 1. Preparar el Servidor

#### Subir Código al Servidor
```bash
# Opción A: Clonar desde GitHub
git clone https://github.com/FRRe-DS/2025-12-TPI.git
cd 2025-12-TPI

# Opción B: Subir archivos por SCP/SFTP
scp -r . usuario@tu-servidor:/opt/logistica-api/
```

### 2. Configurar Variables de Entorno en Portainer

En Portainer, ve a **Stacks** → **Add stack** → **Environment variables**:

```yaml
POSTGRES_PASSWORD=tu_password_seguro_2025
REDIS_PASSWORD=tu_redis_password_2025
JWT_SECRET=tu_jwt_secret_super_seguro_2025
PGADMIN_EMAIL=admin@logistica.com
PGADMIN_PASSWORD=admin123
```

### 3. Crear Stack en Portainer

#### Método A: Desde Archivo (Recomendado)
1. Ve a **Stacks** → **Add stack**
2. Nombre: `logistica-api`
3. **Build method**: Upload
4. Sube el archivo `portainer-stack.yml`
5. Configura las variables de entorno
6. Click **Deploy the stack**

#### Método B: Desde Git Repository
1. Ve a **Stacks** → **Add stack**
2. Nombre: `logistica-api`
3. **Build method**: Repository
4. Repository URL: `https://github.com/FRRe-DS/2025-12-TPI`
5. Compose path: `portainer-stack.yml`
6. Configura las variables de entorno
7. Click **Deploy the stack**

### 4. Verificar Deploy

#### Health Checks
```bash
# Verificar que todos los servicios estén corriendo
curl http://tu-servidor:3000/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "service": "Logística API",
  "version": "1.0.0",
  "environment": "production"
}
```

#### Endpoints de Prueba
```bash
# Obtener métodos de transporte
curl http://tu-servidor:3000/shipping/transport-methods

# Calcular costo (ejemplo)
curl -X POST http://tu-servidor:3000/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_address": {
      "street": "Av. Dirac 1234",
      "city": "Resistencia",
      "state": "Chaco",
      "postal_code": "H3500ABC",
      "country": "AR"
    },
    "products": [
      {"id": 1, "quantity": 2}
    ]
  }'
```

### 5. Configurar Base de Datos

#### Ejecutar Migraciones
```bash
# Conectar al contenedor de la app
docker exec -it logistica-api sh

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar datos iniciales
npx prisma db seed
```

#### Acceder a pgAdmin (Opcional)
1. Ve a: `http://tu-servidor:8080`
2. Login: `admin@logistica.com` / `admin123`
3. Agregar servidor PostgreSQL:
   - Host: `postgres`
   - Port: `5432`
   - Database: `logistica_grupo12`
   - Username: `logistica_user`
   - Password: `tu_password_seguro_2025`

---

## 🔧 CONFIGURACIÓN AVANZADA

### Variables de Entorno Recomendadas

```bash
# Seguridad
POSTGRES_PASSWORD=Logistica2025!SecurePass
REDIS_PASSWORD=Redis2025!SecurePass
JWT_SECRET=JWT_Logistica_2025_Super_Secret_Key_Change_This

# Aplicación
NODE_ENV=production
PORT=3000

# APIs Externas (para futuro)
STOCK_API_URL=http://stock-api:3001
ORDER_API_URL=http://order-api:3002

# Cache
REDIS_TTL=3600

# Logging
LOG_LEVEL=info
```

### Configurar Dominio (Opcional)

Si tienes un dominio, configura un reverse proxy:

```nginx
# /etc/nginx/sites-available/logistica-api
server {
    listen 80;
    server_name api.logistica.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL con Let's Encrypt (Opcional)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d api.logistica.tudominio.com
```

---

## 📊 MONITOREO

### Logs de la Aplicación
```bash
# Ver logs en tiempo real
docker logs -f logistica-api

# Ver logs de PostgreSQL
docker logs -f logistica-postgres

# Ver logs de Redis
docker logs -f logistica-redis
```

### Métricas de Recursos
En Portainer, ve a **Containers** para ver:
- Uso de CPU
- Uso de memoria
- Uso de disco
- Estado de salud

### Backup de Base de Datos
```bash
# Backup manual
docker exec logistica-postgres pg_dump -U logistica_user logistica_grupo12 > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i logistica-postgres psql -U logistica_user logistica_grupo12 < backup_20250101.sql
```

---

## 🚨 TROUBLESHOOTING

### Problemas Comunes

#### 1. "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Ver logs de PostgreSQL
docker logs logistica-postgres

# Verificar conectividad
docker exec logistica-api ping postgres
```

#### 2. "Port already in use"
```bash
# Ver qué está usando el puerto
sudo netstat -tulpn | grep :3000

# Cambiar puerto en portainer-stack.yml
ports:
  - "3001:3000"  # Cambiar puerto externo
```

#### 3. "Build failed"
```bash
# Verificar que Dockerfile existe
ls -la Dockerfile

# Ver logs de build en Portainer
# Ve a Stacks → logistica-api → Logs
```

#### 4. "Health check failed"
```bash
# Verificar endpoint de health
curl http://localhost:3000/health

# Verificar logs de la aplicación
docker logs logistica-api
```

---

## 🔄 ACTUALIZACIONES

### Actualizar Código
```bash
# 1. Subir cambios a GitHub
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# 2. En Portainer: Stacks → logistica-api → Editor
# 3. Actualizar el stack
# 4. Click "Update the stack"
```

### Rollback
```bash
# En Portainer: Stacks → logistica-api → Rollback
# Selecciona la versión anterior
```

---

## 📝 CHECKLIST DE DEPLOY

- [ ] Código subido al servidor
- [ ] Variables de entorno configuradas en Portainer
- [ ] Stack desplegado correctamente
- [ ] Health check pasando (`/health`)
- [ ] Base de datos migrada (`npx prisma migrate deploy`)
- [ ] Datos iniciales cargados (`npx prisma db seed`)
- [ ] Endpoints funcionando (probar `/shipping/transport-methods`)
- [ ] Logs sin errores críticos
- [ ] Backup de base de datos configurado
- [ ] Dominio configurado (opcional)
- [ ] SSL configurado (opcional)

---

## 🎯 RESULTADO FINAL

Una vez completado el deploy, tendrás:

✅ **API funcionando** en `http://tu-servidor:3000`  
✅ **Base de datos** PostgreSQL con datos iniciales  
✅ **Cache** Redis funcionando  
✅ **Admin** pgAdmin en `http://tu-servidor:8080`  
✅ **Health checks** automáticos  
✅ **Logs** centralizados en Portainer  
✅ **Backups** configurables  

**¡Tu API de Logística estará lista para testing!** 🚀
