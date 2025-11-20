# Plan de Integración Frontend (Next.js + Microservicios)

Este plan detalla los pasos para conectar el frontend en Next.js con la nueva arquitectura de microservicios y autenticación Keycloak, sin modificar el backend existente.

## Fase 1: Configuración de Entorno y Autenticación

### 1.1. Variables de Entorno (.env.local)
Crear/Actualizar `.env.local` en la carpeta `frontend/` para apuntar al Gateway local y al Keycloak de producción.

```env
NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.mmalgor.com.ar
NEXT_PUBLIC_KEYCLOAK_REALM=ds-2025-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=grupo-12
```

### 1.2. Cliente HTTP Axios con Interceptor Auth
Configurar una instancia de Axios centralizada que:
1.  Tome la `baseURL` de `NEXT_PUBLIC_API_URL`.
2.  Intercepte las requests para inyectar el header `Authorization: Bearer <TOKEN>` automáticamente obteniendo el token de la sesión de Keycloak (usando `useAuth` o `next-auth` según lo que esté instalado).
3.  Maneje errores 401 (Token expirado) redirigiendo al login.

## Fase 2: Servicios de Integración (Frontend Services)

Crear archivos de servicio en `frontend/src/services` para encapsular las llamadas a la API. Esto mantiene los componentes limpios.

### 2.1. `shipping.service.ts`
Implementar métodos para consumir los endpoints de `shipping-service` a través del Gateway:
*   `getTransportMethods()` -> `GET /shipping/transport-methods` (Ahora disponible en backend).
*   `calculateCost(data)` -> `POST /shipping/cost`.
*   `createShipment(data)` -> `POST /shipping`.
*   `getShipments(filters)` -> `GET /shipping`.
*   `getShipmentById(id)` -> `GET /shipping/:id`.

### 2.2. `tracking.service.ts`
Implementar método para el tracking público (si aplica) o interno.
*   `trackShipment(id)` -> `GET /api/logistics/tracking/:id`.

### 2.3. `stock.service.ts` (Opcional / Lectura)
*   `getProduct(id)` -> `GET /stock/productos/:id`.

## Fase 3: Componentes de UI (Logística)

Implementar o actualizar componentes en `frontend/src/components/logistics` o similar.

### 3.1. Calculadora de Envíos (`ShippingCalculator`)
*   **Input:** Dirección destino (CP), lista de productos (ID, cantidad).
*   **Lógica:** Llama a `shippingService.calculateCost`.
*   **Output:** Muestra costo estimado y desglose.

### 3.2. Formulario de Creación de Envío (`CreateShipmentForm`)
*   **Input:** Selección de método de transporte (cargado desde API), datos de cliente, items.
*   **Lógica:** Llama a `shippingService.createShipment`.

### 3.3. Listado de Envíos (`ShipmentList`)
*   Tabla con paginación y filtros.
*   Llama a `shippingService.getShipments`.

### 3.4. Detalle de Envío (`ShipmentDetail`)
*   Vista completa del envío, historial de estados (`logs`) y tracking.

## Fase 4: Páginas (Routing)

Conectar los componentes a las rutas de Next.js (App Router).

*   `/dashboard`: Mostrar resumen de servicios (usando `/gateway/status`).
*   `/operaciones/envios`: Página principal de gestión de envíos (Listado + Botón Crear).
*   `/operaciones/envios/nuevo`: Página con `CreateShipmentForm`.
*   `/operaciones/cotizar`: Página con `ShippingCalculator`.
*   `/track/[id]`: Página pública (o protegida según requerimiento) para ver estado del envío.

## Fase 5: Pruebas End-to-End (Manuales)

1.  Login en Frontend con usuario de Keycloak.
2.  Navegar a "Cotizar Envío", ingresar CP válido, ver costo.
3.  Crear un envío real. Verificar que aparece en el listado.
4.  Ver detalle del envío creado.
5.  Cancelar envío (si el estado lo permite).

