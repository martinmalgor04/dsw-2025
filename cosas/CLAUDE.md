# 🤖 Claude Code - Módulo de Logística

¡Hola! Soy tu asistente de desarrollo para el **Módulo de Transporte, Logística y Seguimiento - Grupo 12**.

## 📋 Estado Actual del Proyecto

### ✅ Completado
- ✅ Estructura de monorepo configurada (backend/, frontend/, docs/)
- ✅ Backend NestJS con TypeScript configurado
- ✅ Base de datos PostgreSQL configurada con Prisma
- ✅ Redis configurado para cache
- ✅ Docker Compose para desarrollo local
- ✅ Estructura básica de módulos (shipping, transport-methods)
- ✅ API endpoints básicos implementados
- ✅ Documentación OpenAPI/Swagger
- ✅ Tests básicos configurados
- ✅ Estrategia de branches configurada (main, dev, feature/*, fix/*)

### 🚧 En Desarrollo
- 🔄 Reestructuración del proyecto a monorepo
- 🔄 Configuración de contexto del proyecto
- 🔄 Preparación para desarrollo secuencial por sprints

### 📝 Próximas Funcionalidades (Sprint 1)
- 📋 Servicio de Configuración Base
- 📋 Integración con Stock (Cliente HTTP)
- 📋 Servicio de Cotización
- 📋 Esquema de Base de Datos completo

## 🛠️ Comandos Disponibles

### Spec Kit Commands
- `/speckit.plan` - Crear plan de implementación para nuevas funcionalidades
- `/speckit.spec` - Generar especificación detallada
- `/speckit.tasks` - Desglosar tareas de implementación
- `/speckit.implement` - Ejecutar implementación automática

### Desarrollo
- `cd backend && npm run start:dev` - Ejecutar backend en modo desarrollo
- `cd backend && npm run test` - Ejecutar tests del backend
- `cd backend && npm run build` - Compilar backend para producción
- `cd backend && npx prisma studio` - Abrir interfaz de base de datos
- `docker-compose up -d` - Levantar servicios (PostgreSQL, Redis)

## 🎯 Cómo Trabajar Conmigo

### Para Nuevas Funcionalidades
1. **Describe la funcionalidad** que quieres implementar
2. **Usa `/speckit.plan`** para crear un plan detallado
3. **Revisa y ajusta** el plan según tus necesidades
4. **Usa `/speckit.tasks`** para desglosar en tareas específicas
5. **Ejecuta `/speckit.implement`** para implementación automática

### Para Mejoras Existentes
- Describe qué quieres mejorar
- Te ayudo a identificar el código relevante
- Implementamos la mejora paso a paso

### Para Debugging
- Comparte el error o comportamiento inesperado
- Analizo el código y propongo soluciones
- Implementamos la corrección

## 📚 Recursos del Proyecto

- **README.md** - Documentación general del proyecto
- **API-TESTING.md** - Guía de testing de la API
- **openapilog.yaml** - Especificación OpenAPI completa
- **memory/constitution.md** - Principios y reglas del proyecto

## 🔧 Configuración Actual

- **Backend**: Puerto 3000 (NestJS)
- **Base de datos**: PostgreSQL (puerto 5432)
- **Cache**: Redis (puerto 6379)
- **Documentación**: http://localhost:3000/api
- **Estructura**: Monorepo con backend/, frontend/, docs/
- **Branches**: main (producción), dev (integración)

## 💡 Ejemplos de Uso

### Crear Nueva Funcionalidad
```
Quiero implementar el servicio de cotización que consulte a Stock y calcule precios según peso volumétrico y distancia.
```

### Mejorar Funcionalidad Existente
```
El cálculo de costos de envío necesita considerar descuentos por volumen y validar zonas de cobertura.
```

### Debugging
```
El endpoint POST /shipping/cost está devolviendo un error 500 cuando envío productos con peso 0.
```

### Desarrollo por Sprints
```
Necesito implementar el Sprint 1: Fundación Arquitectónica con los servicios de configuración, integración con Stock y cotización.
```

---

**¿En qué puedo ayudarte hoy?** 🚀
