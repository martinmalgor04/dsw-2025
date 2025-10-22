# 🧪 Guía de Testing - Backend

## Configuración Inicial

### 1. Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno
Asegúrate de tener tu archivo `.env.test` configurado en el directorio `backend/` con tu base de datos de testing.

**Para Supabase:**
```bash
# Configuración correcta para Supabase con Prisma
# DATABASE_URL: Para conexión con pooling (aplicación)
DATABASE_URL="postgresql://postgres.ghexalvmqhvfnkgyagzb:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# DIRECT_URL: Para migraciones (conexión directa)
DIRECT_URL="postgresql://postgres.ghexalvmqhvfnkgyagzb:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

**Importante:** Supabase requiere ambas URLs:
- `DATABASE_URL`: Para la aplicación (con pooling)
- `DIRECT_URL`: Para migraciones (conexión directa)

**Ejemplo completo de .env.test:**
```bash
# Puerto de la aplicación
PORT=3000

# Entorno
NODE_ENV=test

# URLs de Supabase (reemplaza [YOUR-PASSWORD] con tu contraseña real)
DATABASE_URL="postgresql://postgres.ghexalvmqhvfnkgyagzb:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ghexalvmqhvfnkgyagzb:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Redis (opcional para testing)
REDIS_URL="redis://localhost:6379"
```

### 3. Configurar Base de Datos de Testing
```bash
# Opción 1: Renombrar temporalmente .env y usar .env.test
mv .env .env.backup
mv .env.test .env
npx prisma migrate deploy
mv .env .env.test
mv .env.backup .env

# Opción 2: Usar variable de entorno directamente
DATABASE_URL="tu_database_url_de_testing" npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate
```

**Nota**: El archivo `.env.test` ya debe contener tu `DATABASE_URL` configurada para testing.

## Ejecutar Tests

### Tests Unitarios
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (se re-ejecutan al cambiar archivos)
npm run test:watch

# Ejecutar tests con cobertura
npm run test:cov

# Ejecutar tests de un archivo específico
npm test -- transport-method.service.spec.ts

# Ejecutar tests de un directorio específico
npm test -- src/config/

# Ejecutar tests de configuración específicamente
npm test -- --testPathPattern="config/services"
```

### Tests de Integración (E2E)
```bash
# Ejecutar tests end-to-end
npm run test:e2e

# Ejecutar tests E2E en modo watch
npm run test:e2e:watch
```

### Tests con Debug
```bash
# Ejecutar tests con debug
npm run test:debug

# Ejecutar tests con verbose output
npm test -- --verbose
```

## Comandos Útiles

### Limpiar y Resetear
```bash
# Limpiar cache de Jest
npm run test:clear

# Resetear tu base de datos de testing (usando DATABASE_URL de .env.test)
npx prisma migrate reset --force

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Verificar Cobertura
```bash
# Generar reporte de cobertura
npm run test:cov

# Abrir reporte de cobertura en navegador
open coverage/lcov-report/index.html
```

### Tests Específicos por Módulo

#### Tests de Configuración
```bash
# Tests del módulo de configuración
npm test -- src/config/

# Tests específicos de servicios
npm test -- src/config/services/

# Tests específicos de controladores
npm test -- src/config/*.controller.spec.ts
```

#### Tests de Shipping
```bash
# Tests del módulo de shipping
npm test -- src/modules/shipping/

# Tests específicos de servicios
npm test -- src/modules/shipping/shipping.service.spec.ts
```

#### Tests de Transport Methods
```bash
# Tests del módulo de transport methods
npm test -- src/modules/transport-methods/
```

## Estructura de Tests

### Archivos de Test
```
backend/
├── src/
│   ├── config/
│   │   ├── services/
│   │   │   ├── transport-method.service.spec.ts
│   │   │   └── coverage-zone.service.spec.ts
│   │   └── *.controller.spec.ts
│   ├── modules/
│   │   ├── shipping/
│   │   │   └── *.spec.ts
│   │   └── transport-methods/
│   │       └── *.spec.ts
│   └── prisma/
│       └── prisma.service.spec.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
└── coverage/
    └── lcov-report/
```

### Convenciones de Naming
- **Unitarios**: `*.service.spec.ts`, `*.controller.spec.ts`
- **E2E**: `*.e2e-spec.ts`
- **Integración**: `*.integration.spec.ts`

## Configuración de Jest

### jest.config.js
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

## Troubleshooting

### Problemas Comunes

#### Error de Base de Datos
```bash
# Error: Database connection failed
# Solución: Verificar que tu base de datos de testing esté corriendo
# y que la DATABASE_URL en .env.test sea correcta

# Verificar conexión a tu base de datos (usando .env.test)
mv .env .env.backup && mv .env.test .env
npx prisma db pull
mv .env .env.test && mv .env.backup .env

# Si necesitas resetear tu base de datos de testing
mv .env .env.backup && mv .env.test .env
npx prisma migrate reset --force
mv .env .env.test && mv .env.backup .env
```

#### Error de Variables de Entorno
```bash
# Error: Environment variable not found: DATABASE_URL
# Solución: Prisma está cargando .env en lugar de .env.test

# Usar .env.test para migraciones
mv .env .env.backup
mv .env.test .env
npx prisma migrate deploy
mv .env .env.test
mv .env.backup .env
```

#### Errores Específicos de Supabase
```bash
# Error: Authentication failed against database server
# Solución: Verificar credenciales de Supabase

# 1. Verificar que ambas URLs estén configuradas:
# DATABASE_URL (pooling) y DIRECT_URL (directa)

# 2. Verificar que el proyecto esté activo en Supabase Dashboard
# 3. Verificar que la contraseña sea correcta

# Error: Connection timeout
# Solución: Verificar conectividad a Supabase
ping aws-1-us-east-2.pooler.supabase.com

# Error: "directUrl is required when using connection pooling"
# Solución: Agregar DIRECT_URL al .env
DIRECT_URL="postgresql://postgres.ghexalvmqhvfnkgyagzb:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Error: Migrations fail
# Solución: Usar DIRECT_URL para migraciones
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

#### Error de Prisma
```bash
# Error: Prisma client not generated
# Solución: Regenerar cliente
npx prisma generate
```

#### Error de Puerto
```bash
# Error: Port 3000 already in use
# Solución: Cambiar puerto en .env.test
PORT=3001
```

#### Error de Cache
```bash
# Error: Tests failing unexpectedly
# Solución: Limpiar cache
npm run test:clear
rm -rf node_modules/.cache
```

### Logs de Debug
```bash
# Ejecutar con logs detallados
DEBUG=* npm test

# Ejecutar con logs de Prisma
DEBUG=prisma:* npm test
```

## Métricas de Calidad

### Cobertura Mínima
- **Servicios**: >80%
- **Controladores**: >70%
- **Módulos completos**: >75%

### Verificar Cobertura
```bash
# Ver cobertura actual
npm run test:cov

# Verificar que cumple mínimos
npm run test:cov -- --coverageThreshold='{"global":{"branches":75,"functions":80,"lines":80,"statements":80}}'
```

## CI/CD

### GitHub Actions
Los tests se ejecutan automáticamente en:
- **Push a main/dev**: Tests unitarios + E2E
- **Pull Request**: Tests unitarios + E2E + Cobertura

### Ejecutar Tests como en CI
```bash
# Simular ejecución en CI
npm ci
npm run test:ci
npm run test:e2e:ci
```

## Recursos Adicionales

### Documentación
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

### Comandos de Ayuda
```bash
# Ver todos los scripts disponibles
npm run

# Ver ayuda de Jest
npx jest --help

# Ver ayuda de Prisma
npx prisma --help
```

---

## Resultados Esperados

### Tests Unitarios Exitosos
```bash
PASS src/config/services/transport-method.service.spec.ts
PASS src/config/services/coverage-zone.service.spec.ts

Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total
```

### Cobertura de Código
```bash
config/services/coverage-zone.service.ts     |     100 |    83.33 |     100 |     100 |
config/services/transport-method.service.ts  |     100 |     87.5 |     100 |     100 |
```

**✅ Supera el requisito del 60% de cobertura (RNF-005)**

---

## 🧪 Scripts de Testing Automatizados

### Scripts Disponibles
```bash
# Script maestro con menú interactivo
cd backend/scripts
./run-all-tests.sh

# Tests específicos
./test-api-local.sh          # Tests API local completa
./test-api-internal.sh       # Tests endpoints internos
./test-api-external.sh       # Tests API externa (requiere EXTERNAL_URL)
```

### Configuración para Tests Externos
```bash
# Configurar URL del servidor externo
export EXTERNAL_URL=https://tu-servidor.com

# Ejecutar tests externos
./test-api-external.sh
```

### Tests Incluidos en Scripts
- ✅ **Endpoints Internos**: `/config/transport-methods`, `/config/coverage-zones`
- ✅ **Endpoints Externos**: `/transport-methods`, `/shipping/cost`, `/shipping`
- ✅ **Validaciones**: Datos inválidos, códigos duplicados, recursos inexistentes
- ✅ **Performance**: Tiempo de respuesta de endpoints críticos
- ✅ **CRUD Completo**: Crear, leer, actualizar métodos y zonas

### Resultados de Scripts
```bash
# Tests exitosos
✅ Status: 200
📄 Response: [datos JSON]

# Tests de validación (esperados)
❌ Status: 400/409/404
📄 Response: [mensaje de error]
```

---

**¡Happy Testing! 🚀**
