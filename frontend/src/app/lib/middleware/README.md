# Middleware Frontend (RF-007/008/009)

Guía rápida para consumir la capa de middleware (HTTP services, stores, hooks, Keycloak, validadores).

## 📦 ¿Qué incluye?
- HttpClient (axios) con interceptores: JWT, 401, retry GET
- Servicios de dominio: config, shipments, vehicles, drivers, routes, reports, health
- Stores (estado global): auth, shipments, config, vehicles, drivers, ui
- Hooks de consumo: useAuth, useShipments, useConfig
- Keycloak scaffolding: keycloak.config, auth.service, KeycloakProvider, ProtectedRoute
- Validadores (Zod) y formatters de estado

## 🚀 Configuración Rápida

Variables de entorno (Vite):
```
VITE_API_URL=http://localhost:3004
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=logistica
VITE_KEYCLOAK_CLIENT_ID=logix-frontend
```

## 🔐 Autenticación (Keycloak)

- Provider (opcional, si usas login real): `src/lib/middleware/auth/KeycloakProvider.tsx`
- Auth service: `src/lib/middleware/auth/auth.service.ts`
- Token persistido en `localStorage: auth_token`

Uso minimal:
```tsx
import { KeycloakProvider } from '@/lib/middleware/auth/KeycloakProvider';

export function Root() {
  return (
    <KeycloakProvider>
      <App />
    </KeycloakProvider>
  );
}
```

Rutas protegidas:
```tsx
import { ProtectedRoute } from '@/lib/middleware/auth/ProtectedRoute';

<Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
```

## 🧰 Hooks

- Auth
```ts
import { useAuth } from '@/lib/middleware/stores/composables/useAuth';
const { isAuthenticated, login, logout } = useAuth();
```

- Config
```ts
import { useConfig } from '@/lib/middleware/stores/composables/useConfig';
const { transportMethods, coverageZones, refresh } = useConfig();
```

- Shipments
```ts
import { useShipments } from '@/lib/middleware/stores/composables/useShipments';
const { items, create, update, remove, select } = useShipments();
```

## 🌐 Servicios HTTP

Ejemplos:
```ts
import { configService } from '@/lib/middleware/services/config.service';
import { shipmentService } from '@/lib/middleware/services/shipment.service';

await configService.getTransportMethods();
await shipmentService.calculateQuote({ /* datos */ });
```

## 🧪 Validación (Zod)
```ts
import { CreateShipmentSchema } from '@/lib/middleware/validators/schemas/shipment.schema';
const valid = await CreateShipmentSchema.parseAsync(formData);
```

## 🧭 Estructura
```
lib/middleware/
  auth/
  errors/
  http/
  interceptors/
  services/
  stores/
    composables/
  validators/
  mappers/
```

## 📌 Notas
- El retry solo aplica a GET
- Para login real, levantar Keycloak (ver DEPLOYMENT.md)
- Los servicios apuntan por defecto a `VITE_API_URL`
