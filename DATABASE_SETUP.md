# Configuración de Base de Datos - Logística Grupo 12

## 🐳 Docker Compose

### Levantar PostgreSQL

```bash
# Levantar la base de datos
docker-compose up -d

# Ver logs
docker-compose logs -f postgres

# Parar los servicios
docker-compose down
```

### Configuración de la Base de Datos

- **Base de datos**: `logistica_grupo12`
- **Usuario**: `logistica_user`
- **Contraseña**: `logistica_password`
- **Puerto**: `5432`
- **Host**: `localhost`

### Variables de Entorno

Crear archivo `.env` con:

```env
DATABASE_URL="postgresql://logistica_user:logistica_password@localhost:5432/logistica_grupo12?schema=public"
PORT=3000
NODE_ENV=development
```

## 🗄️ Configuración de Prisma

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Ver datos en Prisma Studio
npx prisma studio
```

## 🔧 pgAdmin (Opcional)

- **URL**: http://localhost:5050
- **Email**: admin@logistica.com
- **Contraseña**: admin123

### Conectar a la base de datos en pgAdmin:

1. Crear nueva conexión
2. **Host**: postgres (nombre del contenedor)
3. **Puerto**: 5432
4. **Base de datos**: logistica_grupo12
5. **Usuario**: logistica_user
6. **Contraseña**: logistica_password

## 🚀 Comandos Útiles

```bash
# Ver estado de contenedores
docker-compose ps

# Reiniciar solo PostgreSQL
docker-compose restart postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Acceder al contenedor de PostgreSQL
docker-compose exec postgres psql -U logistica_user -d logistica_grupo12
```
