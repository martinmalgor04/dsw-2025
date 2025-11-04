# 📚 Documentación de Deployment - Índice

**Proyecto:** TPI Logística - Grupo 12
**Última actualización:** 2025-11-04

---

## 🎯 Guías de Deployment

### **Deployment en Dokploy:**

1. **[DOKPLOY-README-QUICK.md](./DOKPLOY-README-QUICK.md)** 📖
   - Visión general del deployment
   - Checklist pre-deployment
   - Orden de despliegue
   - Environment variables por servicio

2. **[DOKPLOY-NETWORKING.md](./DOKPLOY-NETWORKING.md)** 🌐
   - Arquitectura de red
   - Configuración por servicio
   - Service discovery
   - URLs y puertos
   - Troubleshooting networking

3. **[DOKPLOY-DATABASE.md](./DOKPLOY-DATABASE.md)** 🗄️
   - Estrategia de PostgreSQL
   - Migraciones Prisma
   - Backups y seguridad
   - Troubleshooting database

4. **[DOKPLOY-ENV-FIX.md](./DOKPLOY-ENV-FIX.md)** ⚠️
   - Problemas conocidos de variables de entorno
   - Fixes aplicados
   - Variables correctas para frontend/backend

---

## 📋 Orden de Lectura Recomendado

### **Primera vez desplegando:**
1. ✅ [DOKPLOY-README-QUICK.md](./DOKPLOY-README-QUICK.md) - Visión general
2. ✅ [DOKPLOY-DATABASE.md](./DOKPLOY-DATABASE.md) - Setup de BD
3. ✅ [DOKPLOY-NETWORKING.md](./DOKPLOY-NETWORKING.md) - Configuración de red
4. ✅ [DOKPLOY-ENV-FIX.md](./DOKPLOY-ENV-FIX.md) - Variables correctas

### **Troubleshooting:**
1. ✅ [DOKPLOY-NETWORKING.md](./DOKPLOY-NETWORKING.md) - Errores de conectividad
2. ✅ [DOKPLOY-DATABASE.md](./DOKPLOY-DATABASE.md) - Errores de BD
3. ✅ [DOKPLOY-ENV-FIX.md](./DOKPLOY-ENV-FIX.md) - Errores de configuración

---

## 🔧 Configuración Rápida

### **Variables de Entorno Esenciales:**

**Frontend:**
```env
NEXT_PUBLIC_API_URL=http://logistica.mmalgor.com.ar:3004
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=logix-frontend
```

**Operator Gateway:**
```env
CONFIG_SERVICE_URL=http://config-service:3003
SHIPPING_SERVICE_URL=http://shipping-service:3001
STOCK_SERVICE_URL=http://stock-integration-service:3002
```

**Microservicios (config, shipping):**
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/logistica_db
```

---

## 🚨 Problemas Comunes

| Síntoma | Documento | Sección |
|---------|-----------|---------|
| Frontend no conecta al API | [DOKPLOY-ENV-FIX.md](./DOKPLOY-ENV-FIX.md) | Variables Frontend |
| Gateway no ve microservicios | [DOKPLOY-NETWORKING.md](./DOKPLOY-NETWORKING.md) | Troubleshooting |
| Tabla no existe en BD | [DOKPLOY-DATABASE.md](./DOKPLOY-DATABASE.md) | Migraciones |
| Login Keycloak falla | [DOKPLOY-ENV-FIX.md](./DOKPLOY-ENV-FIX.md) | Keycloak Config |

---

## 📞 Soporte

- **Issues:** GitHub Issues del proyecto
- **Documentación técnica:** `/docs`
- **Scripts de deployment:** `backend/scripts/`

---

## 🔗 Enlaces Útiles

- [Documentación Backend](../../backend/docs/README.md)
- [Arquitectura del Sistema](../architecture/README.md)
- [Base de Datos - Schema](../database/README.md)
- [API Documentation](../api/README.md)
