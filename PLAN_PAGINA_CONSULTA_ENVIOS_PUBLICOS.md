# Plan: Página de Consulta de Envíos Públicos

## 🎯 Objetivo
Crear una aplicación web independiente que permita a los usuarios consultar el estado de sus envíos mediante un código de envío, sin necesidad de autenticación.

## 📋 Análisis de Requisitos

### Funcionalidades Requeridas
- **Búsqueda por código**: Campo de entrada para código de envío
- **Visualización de datos**: Mostrar información completa del envío
- **Timeline de eventos**: Historial de estados del envío
- **Responsive**: Funcionar en móvil y desktop
- **Independiente**: Separado del frontend principal

### API Disponible
Basado en el análisis del OpenAPI (`openapilog.yaml`):
- **GET /shipping/{shipping_id}**: Obtiene detalles completos del envío
- **GET /shipping**: Lista con filtros (no aplicable para público)

**Limitación identificada**: No existe endpoint público específico para tracking. Usaremos el endpoint de detalles de envío directamente.

## 🏗️ Arquitectura Propuesta

### Estructura del Proyecto
```
tracking-portal/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── SearchForm.tsx
│   │   ├── ShipmentDetails.tsx
│   │   ├── Timeline.tsx
│   │   ├── LoadingState.tsx
│   │   └── ErrorState.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── shipment.ts
│   ├── utils/
│   │   └── formatters.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### Tecnologías
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite (más rápido que Next.js para proyecto simple)
- **Styling**: Tailwind CSS (consistente con el frontend principal)
- **HTTP Client**: Axios
- **Icons**: Lucide React (mismo que el frontend)

### Dependencias Principales
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.6.0",
  "tailwindcss": "^3.3.0",
  "lucide-react": "^0.294.0"
}
```

## 🔧 Implementación Detallada

### 1. Configuración del Proyecto
- Crear carpeta `tracking-portal/` separada del `frontend/`
- Inicializar proyecto con Vite
- Configurar TypeScript y Tailwind CSS
- Configurar ESLint

### 2. API Client
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.VITE_API_URL || 'https://api.logistica-utn.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getShipmentDetails = async (shippingId: string) => {
  const response = await apiClient.get(`/shipping/${shippingId}`);
  return response.data;
};
```

### 3. Tipos de Datos
Basados en el OpenAPI schema `ShippingDetail`:
```typescript
// src/types/shipment.ts
export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ProductQuantity {
  product_id: number;
  quantity: number;
}

export interface ShippingLog {
  timestamp: string;
  status: string;
  message: string;
}

export interface ShipmentDetail {
  shipping_id: number;
  order_id: number;
  user_id: number;
  delivery_address: Address;
  departure_address: Address;
  products: ProductQuantity[];
  status: 'created' | 'reserved' | 'in_transit' | 'delivered' | 'cancelled' | 'in_distribution' | 'arrived';
  transport_type: 'air' | 'sea' | 'rail' | 'road';
  tracking_number?: string;
  carrier_name?: string;
  total_cost?: number;
  currency?: string;
  estimated_delivery_at: string;
  created_at: string;
  updated_at: string;
  logs: ShippingLog[];
}
```

### 4. Componentes Principales

#### SearchForm Component
- Input para código de envío
- Validación básica
- Manejo de errores
- Botón de búsqueda

#### ShipmentDetails Component
- Información general del envío
- Dirección de destino
- Tipo de transporte
- Estado actual
- Costo total
- Fechas estimadas/reales

#### Timeline Component
- Lista de eventos ordenados cronológicamente
- Estados visuales (completado, actual, pendiente)
- Información de ubicación cuando esté disponible

### 5. Estados de la Aplicación
- **Loading**: Mostrar skeleton mientras carga
- **Error**: Manejar errores de API (404, 500, etc.)
- **Success**: Mostrar detalles del envío
- **Not Found**: Mensaje cuando el envío no existe

### 6. Manejo de Errores
- Envío no encontrado (404)
- Error de servidor (500)
- Timeout de conexión
- Validación de entrada

## 🎨 Diseño y UX

### Layout
- Header simple con título
- Contenedor centrado con max-width
- Espaciado consistente
- Diseño responsive

### Paleta de Colores
Mantener consistencia con el frontend:
- Fondo: slate-50
- Cards: white con border slate-200
- Texto principal: slate-900
- Texto secundario: slate-600
- Estados: Usar colores semánticos (verde para completado, azul para actual, etc.)

### Componentes de UI
- Cards con sombras sutiles
- Badges para estados
- Timeline vertical
- Formulario limpio y minimalista

## 🚀 Deployment

### Estrategia
- **Independiente**: Desplegar en servidor separado al frontend
- **Estático**: Generar build estático para hosting simple
- **CDN**: Servir desde CDN para mejor performance

### Configuración
- Variables de entorno para API_URL
- Build optimizado
- Configuración de CORS en el backend (si es necesario)

## 📋 Checklist de Implementación

### Fase 1: Configuración
- [ ] Crear estructura de carpetas
- [ ] Inicializar proyecto con Vite
- [ ] Configurar TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Instalar dependencias

### Fase 2: API y Tipos
- [ ] Definir tipos TypeScript
- [ ] Crear cliente HTTP
- [ ] Implementar llamadas a API
- [ ] Manejo básico de errores

### Fase 3: Componentes
- [ ] SearchForm component
- [ ] ShipmentDetails component
- [ ] Timeline component
- [ ] Loading y Error states

### Fase 4: Integración
- [ ] Ensamblar componentes en App
- [ ] Implementar navegación entre vistas
- [ ] Aplicar estilos finales
- [ ] Testing básico

### Fase 5: Deployment
- [ ] Configurar build de producción
- [ ] Variables de entorno
- [ ] Documentación de deployment

## 🔍 Consideraciones Técnicas

### Seguridad
- No requiere autenticación (público)
- Validación de entrada del lado cliente
- Rate limiting debería manejarse en el backend

### Performance
- Bundle pequeño (Vite tree-shaking)
- Lazy loading si es necesario
- Optimización de imágenes

### Compatibilidad
- Navegadores modernos
- Móvil primero
- Accesibilidad básica (ARIA labels, keyboard navigation)

## 📝 Conclusión

Este plan propone una solución simple pero completa para la consulta pública de envíos. La separación del frontend principal permite deployment independiente y mantenimiento separado, mientras mantiene consistencia visual y técnica con el proyecto existente.
