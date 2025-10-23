# ✓ RF-009: Validadores y Transformadores

## 📋 Información General

| Aspecto | Detalle |
|---------|---------|
| **RF** | RF-009 |
| **Nombre** | Validadores y Transformadores |
| **Prioridad** | P1 - IMPORTANTE |
| **Complejidad** | Baja |
| **Estimación** | 15 horas |
| **Team** | Middleware (1 persona) |
| **Estado** | Diseño |

---

## 🎯 Objetivo

Crear una capa de validación y transformación de datos que proporcione:
- ✅ Schemas de validación con **Zod**
- ✅ Validaciones customizadas (CP argentino, números, etc.)
- ✅ Mensajes de error en español
- ✅ Mappers bidireccionales (DTO ↔ ViewModel)
- ✅ Utilidades de transformación (fechas, moneda, estados)

---

## 📊 Validadores

### 1. **Schemas de Validación** (Zod)

```typescript
// CreateShipmentSchema
export const CreateShipmentSchema = z.object({
  orderId: z.number().positive('Debe ser un número positivo'),
  originAddress: AddressSchema,
  destinationAddress: AddressSchema,
  products: z.array(ProductSchema).min(1, 'Al menos un producto'),
  transportMethod: z.string().uuid('Método de transporte inválido'),
  estimatedDeliveryDate: z.date().min(
    new Date(),
    'La fecha debe ser futura'
  ),
  notes: z.string().optional(),
});

// AddressSchema
export const AddressSchema = z.object({
  street: z.string().min(3, 'Calle requerida'),
  number: z.string(),
  postalCode: z.string().refine(
    (cp) => isValidArgentinePostalCode(cp),
    'Código postal argentino inválido'
  ),
  city: z.string().min(2, 'Ciudad requerida'),
  province: z.string(),
  country: z.string().default('AR'),
});

// ProductSchema
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  weight: z.number().positive('Peso debe ser positivo'),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

// VehicleSchema
export const CreateVehicleSchema = z.object({
  licensePlate: z.string()
    .regex(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/, 'Patente inválida'),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  capacityKg: z.number().positive(),
  volumeM3: z.number().positive(),
  fuelType: z.enum(['DIESEL', 'GASOLINE', 'ELECTRIC', 'GNC']),
});

// DriverSchema
export const CreateDriverSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\+?54[\d\s-]{9,}$/, 'Teléfono inválido'),
  licenseNumber: z.string().min(5),
  licenseType: z.enum(['A', 'B', 'C', 'D']),
});

// RouteSchema
export const CreateRouteSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  transportMethod: z.string().uuid(),
  vehicle: z.string().uuid().optional(),
  driver: z.string().uuid().optional(),
  stops: z.array(RouteStopSchema).min(2, 'Al menos 2 paradas'),
  startDate: z.date(),
  endDate: z.date().optional(),
});

// QuoteRequestSchema
export const QuoteRequestSchema = z.object({
  weight: z.number().positive(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  transportMethod: z.string().uuid(),
  originZone: z.string(),
  destinationZone: z.string(),
  urgency: z.enum(['NORMAL', 'EXPRESS']).optional(),
});
```

### 2. **Validaciones Customizadas**

```typescript
// Código Postal Argentino CPA
export const isValidArgentinePostalCode = (cp: string): boolean => {
  // Formato: ^([A-Z]{1}\d{4}[A-Z]{3})$
  // Ejemplo: C1425
  const cpaRegex = /^([A-Z]{1}\d{4}[A-Z]{3})$/;
  return cpaRegex.test(cp);
};

// Email
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Teléfono argentino
export const isValidArgentinePhone = (phone: string): boolean => {
  // Formatos: +54-11-1234-5678, 011-1234-5678, etc
  return /^\+?54[\d\s-]{9,}$/.test(phone);
};

// Patente vehicular
export const isValidLicensePlate = (plate: string): boolean => {
  // Formato: ABC-123-DEF
  return /^[A-Z]{2}-\d{3}-[A-Z]{2}$/.test(plate);
};

// Número de DNI
export const isValidDNI = (dni: string): boolean => {
  return /^\d{7,8}$/.test(dni);
};

// Fecha futura
export const isFutureDate = (date: Date): boolean => {
  return new Date(date) > new Date();
};

// Número positivo
export const isPositive = (num: number): boolean => {
  return num > 0;
};
```

### 3. **Validación en Formularios**

```typescript
// Hook de validación
export const useFormValidation = (schema: ZodSchema) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = async (data: any) => {
    try {
      await schema.parseAsync(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.fieldErrors;
        const formatted = Object.entries(fieldErrors).reduce(
          (acc, [key, msgs]) => ({
            ...acc,
            [key]: msgs?.[0] || 'Error de validación',
          }),
          {}
        );
        setErrors(formatted);
      }
      return false;
    }
  };

  return { errors, validate };
};
```

---

## 📊 Mappers (Transformadores)

### 1. **DTO → ViewModel** (Backend → UI)

```typescript
// ConfigMapper
export const mapTransportMethodDtoToViewModel = (
  dto: TransportMethodDTO
): TransportMethodViewModel => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  displayName: `${dto.name} (${dto.estimatedDays})`,
  averageSpeed: `${dto.averageSpeed} km/h`,
  estimatedDays: dto.estimatedDays,
  baseCost: {
    perKm: formatCurrency(dto.baseCostPerKm),
    perKg: formatCurrency(dto.baseCostPerKg),
  },
  isAvailable: dto.isActive,
  badge: dto.isActive ? 'Disponible' : 'No disponible',
});

export const mapCoverageZoneDtoToViewModel = (
  dto: CoverageZoneDTO
): CoverageZoneViewModel => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  postalCodesCount: dto.postalCodes.length,
  postalCodesList: dto.postalCodes.join(', '),
  isActive: dto.isActive,
  status: dto.isActive ? 'Activa' : 'Inactiva',
});

// ShipmentMapper
export const mapShipmentDtoToViewModel = (
  dto: ShipmentDTO
): ShipmentViewModel => ({
  id: dto.id,
  orderNumber: `#${String(dto.orderId).padStart(6, '0')}`,
  status: translateShipmentStatus(dto.status),
  statusBadge: getStatusBadgeColor(dto.status),
  origin: `${dto.originAddress.city}, ${dto.originAddress.province}`,
  destination: `${dto.destinationAddress.city}, ${dto.destinationAddress.province}`,
  createdDate: formatDate(dto.createdAt),
  createdTime: formatTime(dto.createdAt),
  estimatedDelivery: formatDate(dto.estimatedDeliveryDate),
  transportMethod: dto.transportMethod?.name || 'N/A',
  totalCost: formatCurrency(dto.totalCost),
  statusTimeline: buildTimeline(dto.logs),
});

// VehicleMapper
export const mapVehicleDtoToViewModel = (
  dto: VehicleDTO
): VehicleViewModel => ({
  id: dto.id,
  licensePlate: dto.licensePlate,
  displayName: `${dto.make} ${dto.model} (${dto.year})`,
  specs: `${dto.capacityKg}kg, ${dto.volumeM3}m³`,
  capacity: {
    weight: `${dto.capacityKg} kg`,
    volume: `${dto.volumeM3} m³`,
  },
  status: translateVehicleStatus(dto.status),
  statusBadge: getVehicleStatusColor(dto.status),
  condition: dto.status === 'AVAILABLE' ? 'Disponible' : 'No disponible',
});

// DriverMapper
export const mapDriverDtoToViewModel = (
  dto: DriverDTO
): DriverViewModel => ({
  id: dto.id,
  fullName: `${dto.firstName} ${dto.lastName}`,
  email: dto.email,
  phone: formatPhone(dto.phone),
  licenseNumber: dto.licenseNumber,
  licenseType: dto.licenseType,
  status: translateDriverStatus(dto.status),
  statusBadge: getDriverStatusColor(dto.status),
  initials: getInitials(`${dto.firstName} ${dto.lastName}`),
});
```

### 2. **FormData → DTO** (UI → Backend)

```typescript
// CreateShipmentFormData → CreateShipmentDTO
export const mapCreateShipmentFormToDto = (
  formData: CreateShipmentFormData
): CreateShipmentDTO => ({
  orderId: parseInt(formData.orderId),
  originAddress: {
    street: formData.originStreet,
    number: formData.originNumber,
    postalCode: formData.originPostalCode.toUpperCase(),
    city: formData.originCity,
    province: formData.originProvince,
    country: 'AR',
  },
  destinationAddress: {
    street: formData.destinationStreet,
    number: formData.destinationNumber,
    postalCode: formData.destinationPostalCode.toUpperCase(),
    city: formData.destinationCity,
    province: formData.destinationProvince,
    country: 'AR',
  },
  products: formData.products.map(p => ({
    id: p.id,
    name: p.name,
    weight: parseFloat(p.weight),
    dimensions: {
      width: parseFloat(p.width),
      height: parseFloat(p.height),
      depth: parseFloat(p.depth),
    },
    quantity: parseInt(p.quantity),
    price: parseFloat(p.price),
  })),
  transportMethod: formData.transportMethodId,
  estimatedDeliveryDate: new Date(formData.estimatedDeliveryDate),
  notes: formData.notes,
});

// CreateVehicleFormData → CreateVehicleDTO
export const mapCreateVehicleFormToDto = (
  formData: CreateVehicleFormData
): CreateVehicleDTO => ({
  licensePlate: formData.licensePlate.toUpperCase(),
  make: formData.make,
  model: formData.model,
  year: parseInt(formData.year),
  capacityKg: parseInt(formData.capacityKg),
  volumeM3: parseFloat(formData.volumeM3),
  fuelType: formData.fuelType as any,
});

// CreateDriverFormData → CreateDriverDTO
export const mapCreateDriverFormToDto = (
  formData: CreateDriverFormData
): CreateDriverDTO => ({
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  email: formData.email.toLowerCase(),
  phone: formData.phone,
  licenseNumber: formData.licenseNumber,
  licenseType: formData.licenseType as any,
});
```

### 3. **DTO → DTO** (Transformaciones internas)

```typescript
// QuoteResponseDTO → PriceBreakdownViewModel
export const mapQuoteToPriceBreakdown = (
  quote: QuoteResponseDTO
): PriceBreakdownViewModel => ({
  baseCost: formatCurrency(quote.baseCost),
  taxes: formatCurrency(quote.taxes),
  taxPercentage: ((quote.taxes / quote.baseCost) * 100).toFixed(2),
  total: formatCurrency(quote.total),
  estimatedDays: quote.estimatedDays,
  breakdown: [
    { label: 'Costo base', value: formatCurrency(quote.baseCost) },
    { label: 'Impuestos', value: formatCurrency(quote.taxes) },
    { label: 'Total', value: formatCurrency(quote.total), isBold: true },
  ],
});

// ShipmentDTO[] → ShipmentsTableViewModel
export const mapShipmentsToTableData = (
  shipments: ShipmentDTO[]
): ShipmentsTableRow[] => {
  return shipments.map(s => ({
    id: s.id,
    order: `#${String(s.orderId).padStart(6, '0')}`,
    origin: `${s.originAddress.city}, ${s.originAddress.province}`,
    destination: `${s.destinationAddress.city}, ${s.destinationAddress.province}`,
    status: translateShipmentStatus(s.status),
    cost: formatCurrency(s.totalCost),
    date: formatDate(s.createdAt),
    actions: ['view', 'edit', 'delete'],
  }));
};
```

---

## 🔄 Utilidades de Transformación

```typescript
// Formateo de Fechas
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} - ${formatTime(date)}`;
};

// Formateo de Moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

// Formateo de Teléfono
export const formatPhone = (phone: string): string => {
  // +54-11-1234-5678 o similar
  return phone.replace(/(\+\d+)(\d{2})(\d{4})(\d{4})/, '$1-$2-$3-$4');
};

// Formateo de CP
export const formatPostalCode = (cp: string): string => {
  return cp.toUpperCase();
};

// Traducción de Estados
export const translateShipmentStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'PENDING': 'Pendiente',
    'CONFIRMED': 'Confirmado',
    'IN_TRANSIT': 'En tránsito',
    'DELIVERED': 'Entregado',
    'FAILED': 'Fallido',
    'CANCELLED': 'Cancelado',
  };
  return translations[status] || status;
};

export const translateVehicleStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'AVAILABLE': 'Disponible',
    'IN_USE': 'En uso',
    'MAINTENANCE': 'Mantenimiento',
    'RETIRED': 'Retirado',
  };
  return translations[status] || status;
};

export const translateDriverStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'ACTIVE': 'Activo',
    'INACTIVE': 'Inactivo',
    'ON_LEAVE': 'Licencia',
    'RETIRED': 'Retirado',
  };
  return translations[status] || status;
};

// Colors para Badges
export const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'CONFIRMED': 'bg-blue-100 text-blue-800',
    'IN_TRANSIT': 'bg-cyan-100 text-cyan-800',
    'DELIVERED': 'bg-green-100 text-green-800',
    'FAILED': 'bg-red-100 text-red-800',
    'CANCELLED': 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Iniciales de nombre
export const getInitials = (fullName: string): string => {
  return fullName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Timeline de estados
export const buildTimeline = (logs: ShipmentLogDTO[]): TimelineEvent[] => {
  return logs.map(log => ({
    status: translateShipmentStatus(log.status),
    date: formatDateTime(log.timestamp),
    location: log.location,
    description: log.description,
  }));
};
```

---

## 📝 Estructura de Carpetas

```
frontend/src/lib/middleware/
├── validators/
│   ├── schemas/
│   │   ├── shipment.schema.ts
│   │   ├── vehicle.schema.ts
│   │   ├── driver.schema.ts
│   │   ├── address.schema.ts
│   │   └── index.ts
│   ├── custom/
│   │   ├── postal-code.ts
│   │   ├── phone.ts
│   │   ├── license-plate.ts
│   │   ├── dni.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useFormValidation.ts
│   │   └── index.ts
│   └── index.ts
├── mappers/
│   ├── config.mapper.ts
│   ├── shipment.mapper.ts
│   ├── vehicle.mapper.ts
│   ├── driver.mapper.ts
│   └── index.ts
├── formatters/
│   ├── date.formatter.ts
│   ├── currency.formatter.ts
│   ├── phone.formatter.ts
│   ├── status.formatter.ts
│   └── index.ts
└── index.ts
```

---

## 📊 Criterios de Aceptación

| # | Criterio | Status |
|---|----------|--------|
| 1 | Schemas Zod para todas las DTOs | ⏳ |
| 2 | CP argentino validado | ⏳ |
| 3 | Teléfono argentino validado | ⏳ |
| 4 | Patente vehicular validada | ⏳ |
| 5 | Mensajes de error en español | ⏳ |
| 6 | Mappers DTO → ViewModel | ⏳ |
| 7 | Mappers FormData → DTO | ⏳ |
| 8 | Formatters de fecha y moneda | ⏳ |
| 9 | Traducción de estados | ⏳ |
| 10 | Hook useFormValidation | ⏳ |
| 11 | Tests >95% coverage | ⏳ |
| 12 | Documentación completa | ⏳ |

---

## 🔗 Dependencias

### Externa
- **Zod**: Validación de schemas
- **React Hooks**: Para useFormValidation

### Interna
- **DTOs del Backend**: Tipos compartidos
- **RF-008**: Stores de estado

---

## 📈 Métricas de Éxito

| Métrica | Target |
|---------|--------|
| Cobertura de tests | > 95% |
| Mensajes en español | 100% |
| Mappers funcionatidad | 100% |
| Validaciones cubiertas | > 95% |

---

## 📚 Referencias

- RF-007: HTTP Services
- RF-008: State Management
- Zod Docs: https://zod.dev
- Intl API: https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Intl
