# 📚 Documentación del Backend

## Índice

- **Arquitectura**: [./architecture/README.md](./architecture/README.md) - Arquitectura de microservicios, patrones y comunicación
- **APIs**: [./api/README.md](./api/README.md) - Guía de endpoints y especificaciones OpenAPI
- **Base de Datos**: [./database/README.md](./database/README.md) - Esquema Prisma, migraciones y convenciones
- **Despliegue**: [./deployment/README.md](./deployment/README.md) - Docker, Dokploy y configuración de producción
- **Geolocalización**: [./geolocation/README.md](./geolocation/README.md) - Cálculo de distancias y coordenadas
- **Redis**: [./redis/README.md](./redis/README.md) - Cache y configuración

## Estado Actual

✅ **Arquitectura de Microservicios Implementada**

El backend está organizado en 4 microservicios independientes:

1. **Config Service** (Port 3003) - Configuración y gestión de flota
2. **Shipping Service** (Port 3001) - Operaciones de envío y cotización
3. **Stock Integration Service** (Port 3002) - Cliente HTTP para API externa de Stock
4. **Operator Interface Service** (Port 3004) - API Gateway para frontend

Cada servicio tiene:
- ✅ Package.json independiente
- ✅ Dockerfile propio
- ✅ Tests E2E completos
- ✅ Documentación Swagger/OpenAPI
- ✅ ENDPOINTS.md con ejemplos
- ✅ Compartición de código vía NPM workspaces (@logistics/*)

## Cómo usar

### Desarrollo Local

```bash
# 1. Levantar dependencias (PostgreSQL, Redis)
docker-compose up -d

# 2. Instalar dependencias
npm install

# 3. Generar cliente Prisma
cd backend/shared/database && npx prisma generate

# 4. Ejecutar migraciones
npx prisma migrate dev

# 5. Levantar todos los servicios
npm run dev:all
```

### Testing

```bash
# Tests unitarios de todos los servicios
npm run test:all

# Tests E2E de todos los servicios
npm run test:e2e:all

# Coverage de un servicio específico
cd backend/services/<service-name>
npm run test:cov
```

### Documentación por Servicio

Cada microservicio tiene su propia documentación completa:

- **Config Service**: [services/config-service/README.md](../services/config-service/README.md) | [Endpoints](../services/config-service/ENDPOINTS.md)
- **Shipping Service**: [services/shipping-service/README.md](../services/shipping-service/README.md) | [Endpoints](../services/shipping-service/ENDPOINTS.md)
- **Stock Integration**: [services/stock-integration-service/README.md](../services/stock-integration-service/README.md) | [Endpoints](../services/stock-integration-service/ENDPOINTS.md)
- **Operator Interface**: [services/operator-interface-service/README.md](../services/operator-interface-service/README.md) | [Endpoints](../services/operator-interface-service/ENDPOINTS.md)

## Acceso a Swagger UI

Cada servicio expone su documentación interactiva:

- Config Service: http://localhost:3003/api/docs
- Shipping Service: http://localhost:3001/api/docs
- Stock Integration: http://localhost:3002/api/docs
- Operator Interface (Gateway): http://localhost:3004/api/docs

---

**Última actualización**: 6 de Noviembre de 2025
**Versión de arquitectura**: Microservicios 1.0
**Mantenido por**: Grupo 12 - UTN FRRE
