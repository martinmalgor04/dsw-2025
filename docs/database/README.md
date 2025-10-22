# 🗄️ Diseño de Base de Datos

## Visión General

Base de datos PostgreSQL alojada en Supabase, diseñada para soportar operaciones de logística y transporte con alta disponibilidad y performance.

## Esquema de Base de Datos

### Tablas Principales

#### 1. `shipments` - Envíos
```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  delivery_street VARCHAR(255) NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_state VARCHAR(100) NOT NULL,
  delivery_postal_code VARCHAR(20) NOT NULL,
  delivery_country VARCHAR(2) DEFAULT 'AR',
  departure_street VARCHAR(255),
  departure_city VARCHAR(100),
  departure_state VARCHAR(100),
  departure_postal_code VARCHAR(20),
  departure_country VARCHAR(2) DEFAULT 'AR',
  status shipping_status DEFAULT 'CREATED',
  transport_type transport_type NOT NULL,
  tracking_number VARCHAR(50) UNIQUE,
  carrier_name VARCHAR(100),
  total_cost DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  estimated_delivery_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);
```

#### 2. `transport_methods` - Métodos de Transporte
```sql
CREATE TABLE transport_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  average_speed INTEGER NOT NULL,
  estimated_days VARCHAR(20) NOT NULL,
  base_cost_per_km DECIMAL(10,2) NOT NULL,
  base_cost_per_kg DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `coverage_zones` - Zonas de Cobertura
```sql
CREATE TABLE coverage_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  postal_codes TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `tariff_configs` - Configuración de Tarifas
```sql
CREATE TABLE tariff_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_method_id UUID REFERENCES transport_methods(id) ON DELETE CASCADE,
  base_tariff DECIMAL(10,2) NOT NULL,
  cost_per_kg DECIMAL(10,2) NOT NULL,
  cost_per_km DECIMAL(10,2) NOT NULL,
  volumetric_factor INTEGER NOT NULL,
  environment VARCHAR(20) DEFAULT 'development',
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tablas de Relación

#### `shipping_products` - Productos en Envíos
```sql
CREATE TABLE shipping_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);
```

#### `shipping_logs` - Logs de Auditoría
```sql
CREATE TABLE shipping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  status shipping_status NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## Enums

### `shipping_status`
```sql
CREATE TYPE shipping_status AS ENUM (
  'CREATED',
  'RESERVED', 
  'IN_TRANSIT',
  'ARRIVED',
  'IN_DISTRIBUTION',
  'DELIVERED',
  'CANCELLED'
);
```

### `transport_type`
```sql
CREATE TYPE transport_type AS ENUM (
  'AIR',
  'SEA', 
  'RAIL',
  'ROAD'
);
```

## Índices

### Índices de Performance
```sql
-- Búsquedas por código postal
CREATE INDEX idx_coverage_zones_postal_codes ON coverage_zones USING GIN (postal_codes);

-- Búsquedas por estado de envío
CREATE INDEX idx_shipments_status ON shipments (status);

-- Búsquedas por tipo de transporte
CREATE INDEX idx_shipments_transport_type ON shipments (transport_type);

-- Búsquedas por fecha de creación
CREATE INDEX idx_shipments_created_at ON shipments (created_at);

-- Búsquedas por usuario
CREATE INDEX idx_shipments_user_id ON shipments (user_id);

-- Búsquedas por orden
CREATE INDEX idx_shipments_order_id ON shipments (order_id);
```

### Índices de Unicidad
```sql
-- Tracking number único
CREATE UNIQUE INDEX idx_shipments_tracking_number ON shipments (tracking_number) WHERE tracking_number IS NOT NULL;

-- Código de método de transporte único
CREATE UNIQUE INDEX idx_transport_methods_code ON transport_methods (code);
```

## Datos Iniciales

### Métodos de Transporte
- **Aéreo**: 800 km/h, 1-3 días, tarifa alta
- **Terrestre**: 80 km/h, 3-7 días, tarifa media
- **Ferroviario**: 60 km/h, 5-10 días, tarifa baja
- **Marítimo**: 30 km/h, 15-30 días, tarifa mínima

### Zonas de Cobertura
- 10 zonas principales de Argentina
- Códigos postales por zona
- Cobertura nacional

### Configuración de Tarifas
- Tarifas por tipo de transporte
- Factor volumétrico configurable
- Configuración por ambiente

## Migraciones

### Prisma Migrations
```bash
# Generar migración
npx prisma migrate dev --name add_new_table

# Aplicar migraciones
npx prisma migrate deploy

# Reset de base de datos
npx prisma migrate reset
```

### Supabase MCP
- Creación directa de tablas via MCP
- Inserción de datos iniciales via MCP
- Sincronización con schema.prisma

## Backup y Recuperación

### Estrategia de Backup
- **Automático**: Supabase backup diario
- **Manual**: Export via pg_dump
- **Retención**: 30 días

### Recuperación
- **Punto en tiempo**: Via Supabase dashboard
- **Completa**: Restore desde backup
- **Parcial**: Restore de tablas específicas

## Monitoreo

### Métricas
- **Performance**: Tiempo de consulta
- **Disponibilidad**: Uptime de conexiones
- **Uso**: Queries por minuto
- **Errores**: Rate de errores SQL

### Alertas
- **Conexiones**: >80% de pool
- **Queries lentas**: >1 segundo
- **Errores**: >5% de queries fallidas

---

**Última actualización**: 16 de Octubre de 2025
