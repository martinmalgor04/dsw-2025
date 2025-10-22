# RF-004: Database Automation Scripts

Colección de scripts bash para automatizar tareas de base de datos en RF-004.

## 📋 Scripts Disponibles

### 1. `migrate-deploy.sh` - Desplegar Migraciones
Aplica migraciones de Prisma a Supabase de forma segura.

**Uso:**
```bash
cd backend/shared/database
./scripts/migrate-deploy.sh
```

**Funcionalidades:**
- ✅ Valida la presencia de `.env`
- ✅ Verifica credenciales de Supabase (DATABASE_URL, DIRECT_URL)
- ✅ Muestra estado actual de migraciones
- ✅ Pide confirmación antes de aplicar
- ✅ Aplica migraciones automáticamente
- ✅ Opcionalmente ejecuta seed data
- ✅ Regenera tipos TypeScript
- ✅ Colores y mensajes de estado

**Ejemplo de Salida:**
```
🔄 RF-004: Database Migration Deploy Script
==============================================
📋 Checking migration status...
(muestra estado actual)

Continue with deployment? (y/n) y
🚀 Deploying migrations...
✅ Migration deployment completed successfully!
Run seed script? (y/n) y
🌱 Running seed...
✅ Seed completed!
📦 Generating Prisma types...
✅ Types generated!

🎉 All done! Database is ready.
```

---

### 2. `monitor-health.sh` - Monitorear Salud de BD
Analiza estadísticas y rendimiento de la base de datos.

**Uso:**
```bash
cd backend/shared/database
./scripts/monitor-health.sh
```

**Información Recopilada:**
- 📦 **Table Sizes** - Tamaño de cada tabla
- 🔍 **Index Usage Statistics** - Uso de índices
- ⚡ **Slow Queries** - Queries que toman > 100ms
- 📈 **Row Counts** - Cantidad de filas por tabla
- 🔗 **Active Connections** - Conexiones activas
- 🔐 **Foreign Keys** - Constraints de integridad
- ⚠️ **Duplicate Indexes** - Índices potencialmente duplicados

**Recomendaciones Automáticas:**
1. Monitor slow queries and optimize them
2. Remove unused indexes
3. Analyze query plans with EXPLAIN ANALYZE
4. Consider partitioning large tables
5. Review connection limits and pooling settings

**Ejemplo de Salida:**
```
🏥 RF-004: Database Health Monitoring
======================================

📊 DATABASE STATISTICS
========================

📦 Table Sizes:
(tabla con tamaños)

🔍 Index Usage Statistics:
(tabla con estadísticas)

...más información...

✅ Health check completed!

💡 RECOMMENDATIONS:
===================
1. Monitor slow queries...
```

---

### 3. `validate-schema.sh` - Validar Integridad del Schema
Valida que el schema esté correcto y todos los componentes estén presentes.

**Uso:**
```bash
cd backend/shared/database
./scripts/validate-schema.sh
```

**Validaciones Realizadas:**
1. ✅ Sintaxis del schema Prisma
2. ✅ Estado de migraciones
3. ✅ Generación de tipos TypeScript
4. ✅ Ejecución de tests de integración
5. ✅ Detección de tablas huérfanas
6. ✅ Verificación de tablas críticas
7. ✅ Verificación de índices
8. ✅ Verificación de foreign keys

**Ejemplo de Salida:**
```
✅ RF-004: Schema Validation
============================

📋 VALIDATION TASKS
====================

1️⃣  Validating Prisma schema syntax...
✅ Prisma schema is valid

2️⃣  Checking migration status...
✅ Migration status checked

...más validaciones...

🎉 Schema validation completed successfully!

Summary:
- Prisma schema: ✅ Valid
- Migrations: ✅ Checked
- Types: ✅ Generated
- Tests: ✅ Run
- Tables: ✅ All present
- Indexes: ✅ Present (12 found)
- Foreign Keys: ✅ Present (8 found)
```

---

## 🔧 Requisitos Previos

### Herramientas Necesarias
- `bash` - Shell scripting
- `psql` - PostgreSQL client (para scripts de monitoreo)
- `npm` - Node package manager
- `npx` - Ejecutor de paquetes npm

### Archivos Requeridos
- `.env` - Debe contener:
  ```
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."
  ```

### Instalación de Dependencias

```bash
# PostgreSQL client (macOS)
brew install postgresql

# O en Linux
sudo apt-get install postgresql-client
```

---

## 📊 Flujo de Trabajo Recomendado

### 1. Primera Vez: Setup Completo
```bash
# Desplegamos migraciones
./scripts/migrate-deploy.sh

# Validamos el schema
./scripts/validate-schema.sh

# Verificamos salud
./scripts/monitor-health.sh
```

### 2. Desarrollo: Validaciones Frecuentes
```bash
# Antes de commitar cambios al schema
./scripts/validate-schema.sh

# Después de cambios en producción
./scripts/monitor-health.sh
```

### 3. Producción: Despliegues Controlados
```bash
# Monitorear antes del despliegue
./scripts/monitor-health.sh

# Desplegar migraciones (pide confirmación)
./scripts/migrate-deploy.sh

# Validar post-despliegue
./scripts/validate-schema.sh

# Monitorear después del despliegue
./scripts/monitor-health.sh
```

---

## 🐛 Troubleshooting

### Error: ".env file not found"
**Causa**: El archivo `.env` no existe en `backend/shared/database/`  
**Solución**: 
```bash
cp ../../.env .env
# O crear manualmente con DATABASE_URL y DIRECT_URL
```

### Error: "psql: command not found"
**Causa**: PostgreSQL client no está instalado  
**Solución**: Instalar `postgresql-client`

### Error: "Permission denied"
**Causa**: Los scripts no tienen permisos de ejecución  
**Solución**: 
```bash
chmod +x *.sh
```

### Error: "DATABASE_URL or DIRECT_URL not set"
**Causa**: Las variables de entorno no están configuradas en `.env`  
**Solución**: Verificar que `.env` contiene ambas URLs

---

## 🔐 Seguridad

### Mejores Prácticas
1. **Never commit `.env`** - Está en `.gitignore`
2. **Use strong passwords** para DATABASE_URL
3. **Restrict script access** - Solo usuarios autorizados
4. **Audit script runs** - Mantener logs de ejecuciones
5. **Use connection pooling** - Para limitar conexiones

---

## 📈 Monitoreo Continuo

### Recomendaciones
- Ejecutar `monitor-health.sh` diariamente en producción
- Revisar slow queries al menos semanalmente
- Validar schema antes de cada despliegue
- Mantener backups regulares

### Métricas a Vigilar
- Query execution time (< 100ms ideal)
- Index usage (confirm all indexes are used)
- Connection count (monitor spikes)
- Table sizes (watch for unexpected growth)
- Disk space (ensure adequate space)

---

## 📚 Documentación Relacionada

- [SCHEMA_GUIDE.md](../SCHEMA_GUIDE.md) - Guía completa del schema
- [IMPLEMENTATION_RF004.md](../IMPLEMENTATION_RF004.md) - Detalles de implementación
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✨ Ejemplos de Uso Avanzado

### Ejecutar un único script en CI/CD
```yaml
# GitHub Actions
- name: Validate Database Schema
  run: |
    cd backend/shared/database
    ./scripts/validate-schema.sh
```

### Ejecutar scripts con logging
```bash
# Guardar salida en archivo
./scripts/migrate-deploy.sh > deploy.log 2>&1

# Enviar correo si hay errores
if [ $? -ne 0 ]; then
    mail -s "DB Deploy Failed" admin@example.com < deploy.log
fi
```

### Ejecutar en schedule
```bash
# Crontab: Ejecutar validación cada 6 horas
0 */6 * * * /path/to/backend/shared/database/scripts/validate-schema.sh

# Ejecutar monitoreo diariamente a las 2 AM
0 2 * * * /path/to/backend/shared/database/scripts/monitor-health.sh
```

---

**Versión**: 1.0  
**Última Actualización**: Octubre 22, 2025  
**Estado**: Production Ready
