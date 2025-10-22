# 📦 RF-008: Stores de Estado Global (Svelte Stores)

## 📋 Información General

| Aspecto | Detalle |
|---------|---------|
| **RF** | RF-008 |
| **Nombre** | Stores de Estado Global |
| **Prioridad** | P1 - IMPORTANTE |
| **Complejidad** | Media |
| **Estimación** | 20 horas |
| **Team** | Middleware (2 personas) |
| **Estado** | Diseño |

---

## 🎯 Objetivo

Crear un sistema robusto de estado global usando Svelte stores que permita:
- ✅ Compartir datos entre componentes sin prop drilling
- ✅ Autenticación con JWT persistente
- ✅ Sincronización automática con backend
- ✅ Derived stores para datos computados
- ✅ Helper functions para operaciones comunes

---

## 📊 Arquitectura

### Flujo de Estado

```
┌─────────────────────────────────┐
│       React Component            │
│   (using useContext/hooks)       │
└──────────────────┬──────────────┘
                   │ Consumes
┌──────────────────▼──────────────┐
│      Store Context Provider     │
│  (Top-level Provider)            │
└──────────────────┬──────────────┘
                   │ Provides
┌──────────────────▼──────────────┐
│     Svelte Stores (State)       │
│  - authStore                    │
│  - shipmentsStore               │
│  - configStore                  │
│  - vehiclesStore                │
│  - driversStore                 │
│  - uiStore                      │
└──────────────────┬──────────────┘
                   │ Syncs with
┌──────────────────▼──────────────┐
│       Backend API (Services)    │
│     (via RF-007 Services)        │
└─────────────────────────────────┘
```

### Persistencia

```
┌──────────────────────────┐
│   Svelte Store (Memory)  │
└──────────────┬───────────┘
               │ Subscribe
┌──────────────▼───────────┐
│   localStorage sync      │
│   (authToken, prefs)     │
└──────────────────────────┘
```

---

## 🏗️ Stores Principales

### 1. **AuthStore** (Autenticación)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  expiresAt: number | null;
}

// Métodos
interface IAuthStore {
  // State
  subscribe(fn): Unsubscriber
  
  // Auth
  login(email, password): Promise<void>
  logout(): Promise<void>
  refreshToken(): Promise<void>
  checkSession(): Promise<void>
  
  // Token
  getToken(): string | null
  setToken(token): void
  isTokenExpired(): boolean
  
  // Helpers
  hasPermission(perm): boolean
  isAdmin(): boolean
}
```

**Persistencia:**
- `token` → localStorage (key: `auth_token`)
- `user` → localStorage (key: `auth_user`)
- Auto-refresh en app startup

**Características:**
- ✅ Login/Logout
- ✅ Token refresh automático antes de expiración
- ✅ Check session al iniciar app
- ✅ Permisos basados en roles

---

### 2. **ShipmentsStore** (Envíos)

```typescript
interface ShipmentsState {
  items: Shipment[];
  selected: Shipment | null;
  filters: ShipmentFilters;
  sorting: SortConfig;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  total: number;
}

interface IShipmentsStore {
  // Queries
  getShipments(): Promise<void>
  getShipment(id): Promise<void>
  
  // Mutations
  createShipment(data): Promise<void>
  updateShipment(id, data): Promise<void>
  deleteShipment(id): Promise<void>
  
  // UI
  setFilter(filters): void
  setSorting(sort): void
  setPage(page): void
  
  // State
  subscribe(fn): Unsubscriber
  getState(): ShipmentsState
}
```

**Derived Stores:**
- `filteredShipments$`: Items filtrados
- `sortedShipments$`: Items ordenados
- `pagedShipments$`: Items paginados
- `hasErrors$`: Si hay errores
- `isEmpty$`: Si está vacío

---

### 3. **ConfigStore** (Métodos de transporte y zonas)

```typescript
interface ConfigState {
  transportMethods: TransportMethod[];
  coverageZones: CoverageZone[];
  tariffConfigs: TariffConfig[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

interface IConfigStore {
  // Queries
  loadTransportMethods(): Promise<void>
  loadCoverageZones(): Promise<void>
  loadTariffConfigs(): Promise<void>
  
  // Helpers
  getTransportMethod(id): TransportMethod | null
  getCoverageZone(id): CoverageZone | null
  
  // State
  subscribe(fn): Unsubscriber
}
```

**Cache Strategy:**
- Cargar una sola vez en app startup
- Recargar manualmente con `refresh()`
- 15 minutos de TTL

---

### 4. **VehiclesStore** (Vehículos)

```typescript
interface VehiclesState {
  items: Vehicle[];
  selected: Vehicle | null;
  filters: VehicleFilters;
  isLoading: boolean;
  error: string | null;
}

interface IVehiclesStore {
  getVehicles(): Promise<void>
  getVehicle(id): Promise<void>
  createVehicle(data): Promise<void>
  updateVehicle(id, data): Promise<void>
  deleteVehicle(id): Promise<void>
  setFilter(filters): void
  subscribe(fn): Unsubscriber
}
```

---

### 5. **DriversStore** (Conductores)

```typescript
interface DriversState {
  items: Driver[];
  selected: Driver | null;
  filters: DriverFilters;
  isLoading: boolean;
  error: string | null;
}

interface IDriversStore {
  getDrivers(): Promise<void>
  getDriver(id): Promise<void>
  createDriver(data): Promise<void>
  updateDriver(id, data): Promise<void>
  deleteDriver(id): Promise<void>
  setFilter(filters): void
  subscribe(fn): Unsubscriber
}
```

---

### 6. **UIStore** (UI Global)

```typescript
interface UIState {
  modals: {
    isOpen: boolean;
    type: ModalType;
    data?: any;
  }[];
  notifications: Notification[];
  loading: boolean;
  theme: 'light' | 'dark';
  sidebar: {
    isOpen: boolean;
    collapsed: boolean;
  };
}

interface IUIStore {
  // Modals
  openModal(type, data?): void
  closeModal(id): void
  
  // Notifications
  showNotification(message, type): void
  showError(error): void
  showSuccess(message): void
  showWarning(message): void
  showInfo(message): void
  
  // UI
  setTheme(theme): void
  toggleSidebar(): void
  setLoading(loading): void
  
  // State
  subscribe(fn): Unsubscriber
}
```

**Toast Notifications:**
```typescript
// Auto-dismiss después de 5 segundos
showNotification('Envío creado', 'success')

// Con acciones
showNotification('Envío eliminado', 'info', {
  action: 'Deshacer',
  onAction: () => restoreShipment(id)
})
```

---

## 📝 Estructura de Carpetas

```
frontend/src/lib/middleware/stores/
├── auth.store.ts              # Autenticación
├── shipments.store.ts         # Envíos
├── config.store.ts            # Configuración
├── vehicles.store.ts          # Vehículos
├── drivers.store.ts           # Conductores
├── ui.store.ts                # UI Global
├── types/
│   ├── store.types.ts
│   └── index.ts
├── composables/               # Custom hooks
│   ├── useAuth.ts
│   ├── useShipments.ts
│   ├── useConfig.ts
│   └── index.ts
├── __tests__/
│   └── stores.spec.ts
└── index.ts                   # Barrel export
```

---

## 🔄 Ciclo de Vida

### App Startup

```
App.tsx mounts
    ↓
authStore.checkSession()
    ↓
Token valid? → Load auth data
    ↓
Load config (methods, zones)
    ↓
Subscribe to updates
    ↓
App ready
```

### Update Flow

```
User action (e.g., create shipment)
    ↓
Component calls store.createShipment()
    ↓
Store calls service.createShipment()
    ↓
Service → API request
    ↓
Success? Update store
Failure? Set error
    ↓
Component re-renders (via subscription)
    ↓
Show notification
```

---

## 🧪 Testing Strategy

### Unit Tests
- Store creation y state
- Subscriptions
- Mutations
- Derived stores

### Integration Tests
- Store + Service integration
- State persistence
- localStorage sync

### E2E Tests
- Full user flows
- State management
- Error handling

---

## 📊 Criterios de Aceptación

| # | Criterio | Status |
|---|----------|--------|
| 1 | AuthStore con login/logout/token | ⏳ |
| 2 | JWT persiste en localStorage | ⏳ |
| 3 | Auto-refresh de token | ⏳ |
| 4 | ShipmentsStore CRUD funcional | ⏳ |
| 5 | Filtros y sorting en ShipmentsStore | ⏳ |
| 6 | ConfigStore con cache de 15m | ⏳ |
| 7 | VehiclesStore y DriversStore | ⏳ |
| 8 | UIStore con modales y notificaciones | ⏳ |
| 9 | Derived stores funcionales | ⏳ |
| 10 | Custom hooks useAuth, useShipments | ⏳ |
| 11 | Sincronización automática | ⏳ |
| 12 | Error handling completo | ⏳ |
| 13 | Tests >95% coverage | ⏳ |
| 14 | Documentación completa | ⏳ |

---

## 🔗 Dependencias

### Externa
- **React Context**: Para integración con componentes
- **Svelte Store API**: Estado reactivo

### Interna
- **RF-007**: Servicios HTTP
- **Validators**: Validación de datos

---

## 📈 Métricas de Éxito

| Métrica | Target |
|---------|--------|
| Cobertura de tests | > 95% |
| Tiempo de actualización | < 100ms |
| Persistencia | 100% de datos críticos |
| Performance | < 10MB de memoria |

---

## 🚀 Próximos Pasos

1. **RF-007 → RF-008 Integración**: Services llaman stores
2. **RF-009**: Validators + Mappers con stores
3. **Componentes**: Consumir stores con custom hooks

---

## 📚 Referencias

- Plan: `plan.md`
- Tasks: `tasks.md`
- RF-007: HTTP Services
- RF-009: Validators & Mappers
