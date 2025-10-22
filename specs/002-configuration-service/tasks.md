# Tareas de Implementación: Servicio de Configuración Base

## Tarea 1: Configurar Base de Datos con Supabase MCP
**Prioridad**: P0 - Crítica  
**Tiempo estimado**: 20 minutos  
**Dependencias**: Ninguna

### Subtareas:
1. **Crear tablas en Supabase via MCP**
   - [ ] Crear tabla `transport_methods` con campos: id, code, name, description, average_speed, estimated_days, base_cost_per_km, base_cost_per_kg, is_active, created_at, updated_at
   - [ ] Crear tabla `coverage_zones` con campos: id, name, description, postal_codes, is_active, created_at, updated_at
   - [ ] Crear tabla `tariff_configs` con campos: id, transport_method_id, base_tariff, cost_per_kg, cost_per_km, volumetric_factor, environment, is_active, valid_from, valid_to, created_at, updated_at
   - [ ] Configurar índices en campos de búsqueda frecuente (code, postal_codes)
   - [ ] Establecer constraints de unicidad (code único en transport_methods)

2. **Actualizar schema.prisma**
   - [ ] Sincronizar schema.prisma con tablas creadas en Supabase
   - [ ] Agregar modelos `TransportMethod`, `CoverageZone`, `TariffConfig`
   - [ ] Configurar provider de PostgreSQL para Supabase
   - [ ] Actualizar DATABASE_URL para Supabase

3. **Verificar conexión**
   - [ ] Ejecutar `npx prisma generate`
   - [ ] Verificar tipos TypeScript generados
   - [ ] Probar conexión a Supabase

### Criterios de aceptación:
- [ ] Tablas creadas en Supabase PostgreSQL
- [ ] Índices configurados para performance
- [ ] Schema compila sin errores
- [ ] Conexión a Supabase funciona
- [ ] Tipos TypeScript están disponibles

---

## Tarea 2: Crear Módulo de Configuración
**Prioridad**: P0 - Crítica  
**Tiempo estimado**: 45 minutos  
**Dependencias**: Tarea 1

### Subtareas:
1. **Crear estructura de directorios**
   - [ ] Crear `backend/src/config/`
   - [ ] Crear `backend/src/config/dto/`
   - [ ] Crear `backend/src/config/services/`
   - [ ] Crear `backend/src/config/entities/`

2. **Crear DTOs de validación**
   - [ ] `CreateTransportMethodDto`
   - [ ] `UpdateTransportMethodDto`
   - [ ] `CreateCoverageZoneDto`
   - [ ] `UpdateCoverageZoneDto`
   - [ ] `TariffConfigDto`

3. **Crear servicios de negocio**
   - [ ] `TransportMethodService`
   - [ ] `CoverageZoneService`
   - [ ] `TariffConfigService`
   - [ ] `ConfigService` principal

4. **Crear módulo principal**
   - [ ] `ConfigModule`
   - [ ] Configurar providers
   - [ ] Configurar exports

### Criterios de aceptación:
- [ ] Estructura de directorios creada
- [ ] DTOs con validaciones implementadas
- [ ] Servicios con lógica de negocio
- [ ] Módulo configurado correctamente

---

## Tarea 3: Implementar Controladores REST
**Prioridad**: P0 - Crítica  
**Tiempo estimado**: 30 minutos  
**Dependencias**: Tarea 2

### Subtareas:
1. **Controlador de Tipos de Transporte**
   - [ ] `GET /config/transport-methods`
   - [ ] `POST /config/transport-methods`
   - [ ] `PATCH /config/transport-methods/:id`

2. **Controlador de Zonas de Cobertura**
   - [ ] `GET /config/coverage-zones`
   - [ ] `POST /config/coverage-zones`
   - [ ] `PATCH /config/coverage-zones/:id`

3. **Controlador de Tarifas**
   - [ ] `GET /config/tariffs`
   - [ ] `PATCH /config/tariffs`

4. **Documentación Swagger**
   - [ ] Agregar decoradores `@ApiTags`
   - [ ] Documentar endpoints
   - [ ] Agregar ejemplos de requests/responses

### Criterios de aceptación:
- [ ] Todos los endpoints funcionan
- [ ] Validación de entrada implementada
- [ ] Manejo de errores implementado
- [ ] Documentación Swagger completa

---

## Tarea 4: Integrar Cache Redis
**Prioridad**: P1 - Alta  
**Tiempo estimado**: 20 minutos  
**Dependencias**: Tarea 2

### Subtareas:
1. **Implementar cache para tipos de transporte**
   - [ ] Cache en `TransportMethodService`
   - [ ] TTL de 1 hora
   - [ ] Invalidación en updates

2. **Implementar cache para zonas de cobertura**
   - [ ] Cache en `CoverageZoneService`
   - [ ] TTL de 1 hora
   - [ ] Invalidación en updates

3. **Implementar cache para tarifas**
   - [ ] Cache en `TariffConfigService`
   - [ ] TTL de 30 minutos
   - [ ] Invalidación en updates

### Criterios de aceptación:
- [ ] Cache funciona correctamente
- [ ] TTL configurado apropiadamente
- [ ] Invalidación automática en updates
- [ ] Performance mejorada

---

## Tarea 5: Insertar Datos Iniciales via MCP
**Prioridad**: P0 - Crítica  
**Tiempo estimado**: 15 minutos  
**Dependencias**: Tarea 1

### Subtareas:
1. **Insertar tipos de transporte via MCP**
   - [ ] Insertar tipo 'air' (Aéreo): velocidad 800 km/h, días 1-3, tarifas base
   - [ ] Insertar tipo 'road' (Terrestre): velocidad 80 km/h, días 3-7, tarifas base
   - [ ] Insertar tipo 'rail' (Ferroviario): velocidad 60 km/h, días 5-10, tarifas base
   - [ ] Insertar tipo 'sea' (Marítimo): velocidad 30 km/h, días 15-30, tarifas base

2. **Insertar zonas de cobertura via MCP**
   - [ ] Buenos Aires Capital (códigos postales C1000-C1005)
   - [ ] Gran Buenos Aires (códigos postales B1600-B1605)
   - [ ] Córdoba Capital (códigos postales X5000-X5005)
   - [ ] Rosario (códigos postales S2000-S2005)
   - [ ] Mendoza Capital (códigos postales M5500-M5505)
   - [ ] Tucumán Capital (códigos postales T4000-T4005)
   - [ ] La Plata (códigos postales B1900-B1905)
   - [ ] Mar del Plata (códigos postales B7600-B7605)
   - [ ] Salta Capital (códigos postales A4400-A4405)
   - [ ] Santa Fe Capital (códigos postales S3000-S3005)

3. **Insertar configuración de tarifas via MCP**
   - [ ] Configuración para tipo 'air': base 100, por kg 8, por km 1.2, factor 200
   - [ ] Configuración para tipo 'road': base 50, por kg 3, por km 0.5, factor 300
   - [ ] Configuración para tipo 'rail': base 30, por kg 2, por km 0.3, factor 400
   - [ ] Configuración para tipo 'sea': base 20, por kg 1.5, por km 0.2, factor 500

### Criterios de aceptación:
- [ ] 4 tipos de transporte insertados correctamente
- [ ] 10 zonas de cobertura argentinas insertadas
- [ ] Configuración de tarifas por tipo insertada
- [ ] Datos son consistentes y válidos
- [ ] Verificación via MCP de datos insertados

---

## Tarea 6: Implementar Tests Unitarios
**Prioridad**: P1 - Alta  
**Tiempo estimado**: 40 minutos  
**Dependencias**: Tarea 2, Tarea 3

### Subtareas:
1. **Tests de servicios**
   - [ ] `TransportMethodService.spec.ts`
   - [ ] `CoverageZoneService.spec.ts`
   - [ ] `TariffConfigService.spec.ts`
   - [ ] `ConfigService.spec.ts`

2. **Tests de controladores**
   - [ ] `TransportMethodController.spec.ts`
   - [ ] `CoverageZoneController.spec.ts`
   - [ ] `TariffController.spec.ts`

3. **Tests de integración**
   - [ ] Tests de endpoints completos
   - [ ] Tests de validación
   - [ ] Tests de manejo de errores

### Criterios de aceptación:
- [ ] Cobertura de tests >80%
- [ ] Todos los tests pasan
- [ ] Casos exitosos y de error cubiertos
- [ ] Tests de integración funcionan

---

## Tarea 7: Documentación y Validación Final
**Prioridad**: P1 - Alta  
**Tiempo estimado**: 20 minutos  
**Dependencias**: Todas las anteriores

### Subtareas:
1. **Actualizar documentación**
   - [ ] Documentación OpenAPI completa
   - [ ] Ejemplos de requests/responses
   - [ ] Documentar DTOs

2. **Validación final**
   - [ ] Verificar endpoints funcionan
   - [ ] Verificar datos iniciales se cargan
   - [ ] Verificar cache funciona
   - [ ] Verificar tests pasan

3. **Verificación de calidad**
   - [ ] Código compila sin errores
   - [ ] Linter pasa sin errores
   - [ ] Performance aceptable (<200ms)

### Criterios de aceptación:
- [ ] Documentación completa y actualizada
- [ ] Todos los endpoints funcionan correctamente
- [ ] Datos iniciales se cargan automáticamente
- [ ] Cache funciona correctamente
- [ ] Tests pasan
- [ ] Código cumple estándares de calidad

---

## Orden de Ejecución Recomendado

1. **Tarea 1** → Configurar Base de Datos con Supabase MCP
2. **Tarea 5** → Insertar Datos Iniciales via MCP (en paralelo con Tarea 2)
3. **Tarea 2** → Crear Módulo de Configuración
4. **Tarea 3** → Implementar Controladores REST
5. **Tarea 4** → Integrar Cache Redis
6. **Tarea 6** → Implementar Tests Unitarios
7. **Tarea 7** → Documentación y Validación Final

## Notas Importantes

- **Supabase MCP**: Usar MCP de Supabase para crear tablas e insertar datos iniciales
- **Dependencias**: Asegurar que Redis esté funcionando antes de implementar cache
- **Validaciones**: Implementar validaciones robustas para códigos postales argentinos
- **Performance**: Monitorear tiempos de respuesta durante desarrollo
- **Testing**: Ejecutar tests después de cada tarea principal
- **Documentación**: Mantener documentación actualizada durante desarrollo
- **Base de datos**: Tablas creadas directamente en Supabase PostgreSQL via MCP
