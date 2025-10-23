# 🏗️ Arquitectura Frontend - Microservicios

## 📋 **Problema Resuelto**

**Antes:** El frontend llamaba solo al puerto 3004 (operator-interface-service) para todas las operaciones, causando errores como:
- `Error: Cannot GET /config/tariff-configs`
- `Error: Cannot GET /config/transport-methods`

**Ahora:** Cada servicio llama directamente al microservicio correspondiente.

## 🔧 **Solución Implementada**

### **1. Clientes HTTP Específicos**

#### **Configuración por Servicio** (`frontend/src/lib/middleware/http/config.ts`)
```typescript
export const serviceConfigs = {
  operator: { baseURL: 'http://localhost:3004' },  // Operator Interface
  config: { baseURL: 'http://localhost:3003' },    // Config Service
  shipping: { baseURL: 'http://localhost:3001' },  // Shipping Service
  stock: { baseURL: 'http://localhost:3002' },     // Stock Service
};
```

#### **Cliente Config Service** (`frontend/src/lib/middleware/http/config-client.ts`)
- Cliente HTTP específico para Config Service (puerto 3003)
- Interceptores de request/response
- Logging automático
- Manejo de errores

### **2. Servicios Actualizados**

#### **Config Service** (`frontend/src/lib/middleware/services/config.service.ts`)
- ✅ **Transport Methods**: `/config/transport-methods` → Puerto 3003
- ✅ **Coverage Zones**: `/config/coverage-zones` → Puerto 3003
- ✅ **Tariff Configs**: `/config/tariff-configs` → Puerto 3003

#### **Tariff Config Service** (`frontend/src/lib/middleware/services/tariff-config.service.ts`)
- ✅ **CRUD completo** para Tariff Configs
- ✅ **Filtros** por transportMethodId, isActive, environment
- ✅ **Relaciones** con Transport Methods

### **3. Store y Composable**

#### **Config Store** (`frontend/src/lib/middleware/stores/config.store.ts`)
- ✅ **Estado centralizado** para todos los servicios de configuración
- ✅ **CRUD completo** para Transport Methods, Coverage Zones, Tariff Configs
- ✅ **Cache inteligente** (15 minutos)
- ✅ **Manejo de errores** centralizado

#### **UseConfig Hook** (`frontend/src/lib/middleware/stores/composables/useConfig.ts`)
- ✅ **Hook React** para usar el store
- ✅ **Acciones** para CRUD de todos los servicios
- ✅ **Estados** de loading, error, datos

## 🎯 **Flujo de Datos**

### **Transport Methods**
```
Frontend → configHttpClient → Config Service (3003) → Supabase
```

### **Coverage Zones**
```
Frontend → configHttpClient → Config Service (3003) → Supabase
```

### **Tariff Configs**
```
Frontend → configHttpClient → Config Service (3003) → Supabase
```

### **Vehicles/Drivers**
```
Frontend → httpClient → Operator Interface (3004) → Supabase
```

## 📊 **Mapeo de Puertos**

| Servicio | Puerto | Endpoints | Cliente |
|----------|--------|-----------|---------|
| **Config Service** | 3003 | `/config/*` | `configHttpClient` |
| **Operator Interface** | 3004 | `/vehicles/*`, `/drivers/*` | `httpClient` |
| **Shipping Service** | 3001 | `/shipping/*` | `httpClient` |
| **Stock Service** | 3002 | `/stock/*` | `httpClient` |

## 🔍 **Variables de Entorno**

### **Desarrollo Local**
```bash
VITE_CONFIG_URL=http://localhost:3003
VITE_OPERATOR_URL=http://localhost:3004
VITE_SHIPPING_URL=http://localhost:3001
VITE_STOCK_URL=http://localhost:3002
```

### **Producción**
```bash
VITE_CONFIG_URL=https://config.tu-dominio.com
VITE_OPERATOR_URL=https://api.tu-dominio.com
VITE_SHIPPING_URL=https://shipping.tu-dominio.com
VITE_STOCK_URL=https://stock.tu-dominio.com
```

## ✅ **Beneficios**

### **1. Separación de Responsabilidades**
- ✅ **Config Service**: Solo configuración (Transport Methods, Coverage Zones, Tariff Configs)
- ✅ **Operator Interface**: Solo operaciones (Vehicles, Drivers, Routes)
- ✅ **Shipping Service**: Solo envíos
- ✅ **Stock Service**: Solo inventario

### **2. Escalabilidad**
- ✅ **Cada servicio** puede escalar independientemente
- ✅ **Carga distribuida** entre microservicios
- ✅ **Fallos aislados** (si Config Service falla, Operator Interface sigue funcionando)

### **3. Mantenibilidad**
- ✅ **Código organizado** por responsabilidad
- ✅ **Fácil debugging** (logs específicos por servicio)
- ✅ **Testing independiente** por servicio

### **4. Performance**
- ✅ **Llamadas directas** (sin proxy innecesario)
- ✅ **Cache específico** por servicio
- ✅ **Retry logic** personalizado por servicio

## 🚨 **Troubleshooting**

### **Error: Cannot GET /config/transport-methods**
- ✅ **Verificar** que Config Service esté corriendo en puerto 3003
- ✅ **Verificar** que `configHttpClient` esté configurado correctamente
- ✅ **Verificar** logs del Config Service

### **Error: Cannot GET /config/tariff-configs**
- ✅ **Verificar** que el endpoint exista en Config Service
- ✅ **Verificar** que `tariffConfigService` esté importado correctamente
- ✅ **Verificar** que el store esté actualizado

### **Error de CORS**
- ✅ **Verificar** que Config Service tenga CORS habilitado para localhost:3000
- ✅ **Verificar** que las URLs estén correctas en las variables de entorno

## 📝 **Próximos Pasos**

1. **Implementar** clientes específicos para Shipping y Stock Services
2. **Agregar** interceptores de autenticación
3. **Implementar** cache más sofisticado
4. **Agregar** métricas y monitoreo
5. **Implementar** retry logic más avanzado
