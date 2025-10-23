# 🚀 Backend - Módulo de Logística

Microservicio NestJS para gestión de logística y transporte.

## 📋 Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL 15+ (Supabase)
- Redis 7+ (opcional)
- Docker (opcional, para desarrollo local)

## ⚙️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en el directorio `backend/` con la siguiente configuración:

```bash
# Database Configuration (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Redis Configuration (opcional)
REDIS_HOST="localhost"
REDIS_PORT=6379

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Cómo obtener tu `DATABASE_URL` de Supabase:**
1. Ve a tu proyecto en https://supabase.com/dashboard
2. Navega a Settings → Database
3. Copia la "Connection string" y reemplaza `[YOUR-PASSWORD]` con tu password real

### 2. Instalar Dependencias

```bash
cd backend
npm install
```

### 3. Generar Cliente Prisma

```bash
npx prisma generate
```

## 🗄️ Base de Datos

La base de datos ya está configurada en Supabase con las siguientes tablas:
- `transport_methods` - Tipos de transporte
- `coverage_zones` - Zonas de cobertura
- `tariff_configs` - Configuración de tarifas

Los datos iniciales ya fueron insertados via MCP de Supabase.

## 🏃‍♂️ Ejecutar el Proyecto

### Modo Desarrollo
```bash
npm run start:dev
```

El servidor estará disponible en:
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs

### Modo Producción
```bash
npm run build
npm run start:prod
```

## 🧪 Testing

### Ejecutar Tests
```bash
npm test
```

### Ejecutar Tests con Cobertura
```bash
npm test -- --coverage
```

### Tests de un Módulo Específico
```bash
npm test -- src/config/
```

## 📡 API Endpoints

### API Externa (Logística)
- `POST /shipping/cost` - Calcular costo de envío
- `POST /shipping` - Crear envío
- `GET /shipping` - Listar envíos
- `GET /shipping/:id` - Detalle de envío
- `POST /shipping/:id/cancel` - Cancelar envío

### API Interna (Configuración)
- `GET /config/transport-methods` - Lista métodos de transporte
- `POST /config/transport-methods` - Crea método de transporte
- `PATCH /config/transport-methods/:id` - Actualiza método
- `GET /config/coverage-zones` - Lista zonas de cobertura
- `POST /config/coverage-zones` - Crea zona de cobertura
- `PATCH /config/coverage-zones/:id` - Actualiza zona

Ver documentación completa en:
- **API Externa**: `/openapilog.yaml`
- **API Interna**: `/openapiint.yml`

## 📂 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/                      # RF-001: Configuración Base
│   │   ├── dto/                     # DTOs de validación
│   │   ├── services/                # Lógica de negocio
│   │   ├── *.controller.ts          # Controladores REST
│   │   └── config.module.ts         # Módulo NestJS
│   │
│   ├── modules/
│   │   ├── shipping/                # Gestión de envíos
│   │   └── transport-methods/       # Métodos de transporte (API externa)
│   │
│   ├── common/                      # Compartido
│   │   ├── dto/
│   │   ├── enums/
│   │   └── services/
│   │
│   ├── prisma/                      # Prisma ORM
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── app.module.ts                # Módulo principal
│   └── main.ts                      # Entry point
│
├── prisma/
│   ├── schema.prisma                # Esquema de base de datos
│   └── seed.ts                      # Datos iniciales
│
└── test/                            # Tests E2E
```

## 🛠️ Scripts Disponibles

- `npm run start` - Inicia el servidor
- `npm run start:dev` - Modo desarrollo con hot reload
- `npm run start:prod` - Modo producción
- `npm run build` - Compila el proyecto
- `npm test` - Ejecuta tests unitarios
- `npm run test:watch` - Tests en modo watch
- `npm run test:cov` - Tests con cobertura
- `npm run test:e2e` - Tests end-to-end
- `npm run lint` - Ejecuta ESLint
- `npm run format` - Formatea código con Prettier

## 🐳 Docker (Opcional)

Para levantar PostgreSQL y Redis en Docker:

```bash
cd ..
docker-compose up -d
```

Esto levantará:
- PostgreSQL en puerto 5432
- Redis en puerto 6379

## 📚 Documentación Adicional

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI Spec (Externa)**: `/openapilog.yaml`
- **OpenAPI Spec (Interna)**: `/openapiint.yml`
- **Prisma Studio**: `npx prisma studio` (GUI para DB)

## 🔧 Troubleshooting

### Error: "DATABASE_URL not found"
Asegúrate de tener el archivo `.env` en el directorio `backend/` con la variable `DATABASE_URL` configurada.

### Error: "Cannot connect to database"
1. Verifica que la URL de Supabase sea correcta
2. Verifica que tu IP esté permitida en Supabase (Settings → Database → Connection pooling)
3. Verifica que el password sea correcto

### Error: "Redis connection failed"
Redis es opcional. Si no lo necesitas, el proyecto funcionará sin él.

### Tests fallan
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
npm test
```

## 📝 Notas

- La base de datos está en Supabase PostgreSQL
- Los datos iniciales ya están insertados (4 tipos transporte, 10 zonas cobertura)
- Cache Redis es opcional (implementación pendiente)
- Los tests no requieren base de datos real (usan mocks)

## 🤝 Contribución

Ver `CONTRIBUTING.md` en la raíz del proyecto.

---

