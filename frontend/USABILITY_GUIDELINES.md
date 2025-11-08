# Guía de Usabilidad y Mejores Prácticas

## RNF-006: Criterios de Usabilidad

Esta guía documenta los estándares de usabilidad implementados en el sistema y proporciona lineamientos para mantener la consistencia.

---

## 1. Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
<640px   → Mobile (sm)
640-1024px → Tablet (md/lg)
>1024px  → Desktop (xl/2xl)
```

### Implementación

#### Grid Responsive
```tsx
// ✅ Correcto
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// ❌ Incorrecto - No responsive
<div className="grid grid-cols-4 gap-4">
```

#### Flex Responsive
```tsx
// ✅ Correcto
<div className="flex flex-col lg:flex-row gap-4">

// ❌ Incorrecto
<div className="flex flex-row gap-4">
```

#### Text Responsive
```tsx
// ✅ Correcto
<h1 className="text-xl sm:text-2xl lg:text-3xl">

// ❌ Incorrecto
<h1 className="text-3xl">
```

### Checklist por Página

- [ ] Header responsive (hamburger menu en mobile)
- [ ] Tablas con scroll horizontal en mobile
- [ ] Formularios en columna única en mobile
- [ ] Botones touch-friendly (min 44px altura)
- [ ] Texto legible en todos los tamaños
- [ ] Imágenes/gráficos escalables

### Testing

```bash
# Chrome DevTools
1. F12 → Toggle Device Toolbar
2. Probar en:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

# Firefox
1. F12 → Responsive Design Mode
2. Probar mismos dispositivos
```

---

## 2. Loading States

### Tipos de Loading States

#### 1. Skeleton Loaders (Preferido)
```tsx
// ✅ Usar skeletons para listas y cards
{isLoading && (
  <div className="animate-pulse space-y-4">
    <div className="h-12 bg-slate-200 rounded"></div>
    <div className="h-12 bg-slate-200 rounded"></div>
  </div>
)}
```

#### 2. Spinner (Solo para botones)
```tsx
// ✅ Spinner inline en botones
<button disabled={isLoading}>
  {isLoading ? (
    <span className="inline-block animate-spin">⏳</span>
  ) : (
    'Guardar'
  )}
</button>
```

#### 3. Full Page Loader (Evitar)
```tsx
// ❌ Evitar - Mala UX
{isLoading && <div className="fullscreen-spinner">...</div>}
```

### Implementación Estándar

```tsx
export default function MyPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading skeleton
  if (isLoading && !data) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={loadData} />;
  }

  // Success state
  return <DataDisplay data={data} />;
}
```

### Checklist

- [ ] Loading state en fetch inicial
- [ ] Loading state en acciones (guardar, eliminar, etc.)
- [ ] Botones deshabilitados durante loading
- [ ] Feedback visual claro
- [ ] No bloquear toda la UI
- [ ] Timeout para loaders largos (>5s)

---

## 3. Mensajes de Error en Español

### Formato Estándar

```tsx
// Error Display Component
interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="rounded-lg p-6 bg-red-50 border border-red-200">
      <h3 className="text-base font-semibold text-red-900 mb-2">
        Error
      </h3>
      <p className="text-sm text-red-700 mb-4">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
```

### Traducción de Errores Comunes

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  // Network Errors
  'Network Error': 'Error de conexión. Verifica tu internet.',
  'timeout': 'La solicitud tardó demasiado. Intenta nuevamente.',

  // Auth Errors
  'Unauthorized': 'No estás autorizado. Inicia sesión nuevamente.',
  'Forbidden': 'No tienes permisos para esta acción.',
  'Token expired': 'Tu sesión ha expirado. Inicia sesión nuevamente.',

  // Validation Errors
  'Validation failed': 'Los datos proporcionados son inválidos.',
  'Required field': 'Este campo es requerido.',
  'Invalid format': 'El formato es inválido.',

  // Resource Errors
  'Not found': 'No se encontró el recurso solicitado.',
  'Already exists': 'Ya existe un registro con estos datos.',

  // Server Errors
  'Internal Server Error': 'Error del servidor. Intenta nuevamente más tarde.',
  'Service Unavailable': 'Servicio temporalmente no disponible.',
};

export function translateError(error: string): string {
  return ERROR_MESSAGES[error] || error;
}
```

### Uso con Toast Notifications

```tsx
import { toast } from 'sonner';

// ✅ Correcto - Mensajes en español
try {
  await saveData();
  toast.success('Datos guardados exitosamente');
} catch (error) {
  toast.error(translateError(error.message));
}

// ❌ Incorrecto - Mensajes en inglés
toast.error('Failed to save data');
```

### Checklist

- [ ] Todos los errores traducidos
- [ ] Mensajes descriptivos (no técnicos)
- [ ] Botón "Reintentar" cuando aplique
- [ ] No mostrar stack traces al usuario
- [ ] Logging de errores en consola para debug

---

## 4. Confirmaciones para Acciones Destructivas

### Acciones que Requieren Confirmación

- ❗ Eliminar registros
- ❗ Cancelar envíos
- ❗ Desactivar usuarios
- ❗ Cambios irreversibles
- ✅ Guardar cambios (no requiere confirmación)
- ✅ Filtrar datos (no requiere confirmación)

### Implementación con AlertDialog

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/confirm-dialog';

function DeleteButton({ id, onDelete }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="px-3 py-1.5 bg-red-600 text-white rounded">
          Eliminar
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El registro será eliminado permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(id)}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Mejores Prácticas

1. **Título claro**: "¿Estás seguro?" o "Confirmar eliminación"
2. **Descripción específica**: Mencionar qué se va a eliminar/cambiar
3. **Botón de cancelación prominente**: Fácil de encontrar
4. **Botón de acción en rojo**: Para acciones destructivas
5. **Texto del botón específico**: "Eliminar" en vez de "Aceptar"

### Checklist

- [ ] Confirmación en DELETE operations
- [ ] Confirmación en CANCEL operations
- [ ] Confirmación en cambios de estado críticos
- [ ] Modal con foco en botón cancelar
- [ ] ESC para cerrar modal
- [ ] Click fuera del modal para cerrar

---

## 5. Feedback Visual Inmediato

### Toast Notifications

```tsx
import { toast } from 'sonner';

// Success
toast.success('Envío creado exitosamente');

// Error
toast.error('No se pudo guardar los cambios');

// Warning
toast.warning('Algunos campos están incompletos');

// Info
toast.info('Los datos se actualizaron en segundo plano');

// Loading
const loadingToast = toast.loading('Guardando cambios...');
// ... async operation
toast.dismiss(loadingToast);
toast.success('Cambios guardados');
```

### Estados de Botones

```tsx
// ✅ Correcto - Feedback visual claro
<button
  disabled={isLoading}
  className={`px-4 py-2 rounded transition-colors ${
    isLoading
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700'
  }`}
>
  {isLoading ? 'Guardando...' : 'Guardar'}
</button>

// ❌ Incorrecto - Sin feedback
<button onClick={save}>
  Guardar
</button>
```

### Hover States

```tsx
// ✅ Siempre agregar hover states
className="hover:bg-slate-50 hover:shadow-md transition-all"

// Transiciones suaves
className="transition-colors duration-200"
```

### Focus States (Accesibilidad)

```tsx
// ✅ Focus ring visible
className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
```

### Checklist

- [ ] Toast notification en todas las acciones
- [ ] Hover states en elementos interactivos
- [ ] Focus states para teclado
- [ ] Disabled states visuales
- [ ] Loading states en botones
- [ ] Transiciones suaves (200-300ms)

---

## 6. Navegación por Teclado

### Shortcuts Comunes

```tsx
// ESC para cerrar modales
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, []);

// Enter para submit en formularios
<form onSubmit={handleSubmit}>
  <input type="text" />
  <button type="submit">Guardar</button>
</form>

// Tab navigation
// Radix UI ya maneja esto automáticamente
```

### Focus Management

```tsx
// Auto-focus en modal abierto
<input
  ref={inputRef}
  autoFocus
  type="text"
/>

// Focus trap en modales (Radix Dialog lo hace automáticamente)
```

### Checklist

- [ ] Tab navega por todos los elementos interactivos
- [ ] Enter submit en formularios
- [ ] ESC cierra modales
- [ ] Focus visible (outline)
- [ ] Skip links para navegación rápida
- [ ] ARIA labels donde sea necesario

---

## 7. Formularios

### Validación

```tsx
// ✅ Validación en tiempo real
const [errors, setErrors] = useState({});

const validateField = (name: string, value: string) => {
  switch (name) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? null
        : 'Email inválido';
    case 'phone':
      return /^\d{10}$/.test(value)
        ? null
        : 'Teléfono debe tener 10 dígitos';
    default:
      return null;
  }
};

<input
  name="email"
  onChange={(e) => {
    const error = validateField('email', e.target.value);
    setErrors({ ...errors, email: error });
  }}
/>
{errors.email && (
  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
)}
```

### Labels Siempre Visibles

```tsx
// ✅ Correcto - Label visible
<div>
  <label htmlFor="name" className="block text-sm font-medium mb-1">
    Nombre
  </label>
  <input
    id="name"
    type="text"
    placeholder="Juan Pérez"
  />
</div>

// ❌ Incorrecto - Solo placeholder
<input type="text" placeholder="Nombre" />
```

### Checklist

- [ ] Labels en todos los inputs
- [ ] Validación en tiempo real
- [ ] Mensajes de error claros
- [ ] Submit button deshabilitado si inválido
- [ ] Autocomplete attributes
- [ ] Required fields marcados visualmente

---

## 8. Tablas

### Responsive Tables

```tsx
// ✅ Scroll horizontal en mobile
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px]">
    {/* ... */}
  </table>
</div>

// ❌ Tabla que rompe layout en mobile
<table className="w-full">
  {/* ... */}
</table>
```

### Empty States

```tsx
// ✅ Mensaje claro cuando no hay datos
{data.length === 0 && (
  <div className="p-8 text-center">
    <p className="text-slate-600">No se encontraron registros</p>
    <button
      onClick={clearFilters}
      className="mt-4 text-blue-600 hover:text-blue-700"
    >
      Limpiar filtros
    </button>
  </div>
)}
```

### Paginación

```tsx
// ✅ Paginación clara
<div className="flex items-center justify-between">
  <button disabled={page === 1}>Anterior</button>
  <span>Página {page} de {totalPages}</span>
  <button disabled={page === totalPages}>Siguiente</button>
</div>
```

### Checklist

- [ ] Scroll horizontal en mobile
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Paginación
- [ ] Sorting (opcional)
- [ ] Click en fila para detalles

---

## 9. Accesibilidad (WCAG AA)

### Contraste de Color

```css
/* ✅ Cumple WCAG AA */
color: #1e293b; /* slate-900 */
background: #ffffff;
/* Ratio: 16.1:1 */

/* ❌ No cumple */
color: #cbd5e1; /* slate-300 */
background: #ffffff;
/* Ratio: 2.1:1 (necesita 4.5:1) */
```

### Alt Text

```tsx
// ✅ Siempre incluir alt
<img src="/logo.png" alt="Logo PEPACK" />

// ❌ Sin alt
<img src="/logo.png" />
```

### ARIA Labels

```tsx
// ✅ Para iconos sin texto
<button aria-label="Cerrar modal">
  <X className="w-4 h-4" />
</button>

// ✅ Para elementos interactivos
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Clickable div
</div>
```

### Checklist

- [ ] Contraste mínimo 4.5:1
- [ ] Alt text en imágenes
- [ ] ARIA labels en iconos
- [ ] Roles semánticos
- [ ] Navegación por teclado
- [ ] Screen reader friendly

---

## 10. Performance

### Code Splitting

```tsx
// ✅ Lazy load componentes pesados
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<LoadingSkeleton />}>
  <HeavyChart data={data} />
</Suspense>
```

### Optimización de Re-renders

```tsx
// ✅ Usar useCallback para funciones
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

// ✅ Usar useMemo para cálculos pesados
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### Checklist

- [ ] Lazy loading de routes
- [ ] Imágenes optimizadas
- [ ] Debounce en search inputs
- [ ] Virtual scrolling para listas largas
- [ ] Memoización donde aplique

---

## Testing Checklist General

### Por cada página nueva:

#### Responsive
- [ ] Mobile (375px) - iPhone SE
- [ ] Tablet (768px) - iPad
- [ ] Desktop (1920px) - Full HD

#### Estados
- [ ] Loading inicial
- [ ] Loading en acciones
- [ ] Error state
- [ ] Empty state
- [ ] Success state

#### Interacciones
- [ ] Click en botones
- [ ] Submit formularios
- [ ] Confirmación modales
- [ ] Toast notifications
- [ ] Keyboard navigation

#### Accesibilidad
- [ ] Contraste colores
- [ ] Alt texts
- [ ] ARIA labels
- [ ] Screen reader
- [ ] Keyboard only

#### Performance
- [ ] Tiempo de carga < 3s
- [ ] No re-renders innecesarios
- [ ] Imágenes optimizadas
- [ ] Bundle size razonable

---

## Herramientas de Testing

### Chrome DevTools
- **Lighthouse**: Auditoría de performance y accesibilidad
- **Device Toolbar**: Testing responsive
- **Network Tab**: Verificar requests

### Firefox Developer Tools
- **Responsive Design Mode**: Testing en diferentes dispositivos
- **Accessibility Inspector**: Verificar ARIA y semántica

### Extensions Útiles
- **WAVE**: Accessibility checker
- **axe DevTools**: Accessibility testing
- **React Developer Tools**: Debug componentes

---

## Resumen de Prioridades

### 🔴 Crítico (Siempre requerido)
1. Responsive design
2. Loading states
3. Mensajes de error en español
4. Confirmación en acciones destructivas

### 🟡 Importante (Muy recomendado)
5. Toast notifications
6. Focus states
7. Empty states
8. Keyboard navigation

### 🟢 Nice to have (Opcional)
9. Animations
10. Advanced accessibility
11. Performance optimizations

---

## Referencias

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Usability](https://material.io/design/usability)
- [React Best Practices](https://react.dev/learn)
