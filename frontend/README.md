# 🎨 Frontend - Módulo de Logística

Frontend SvelteKit para la gestión de logística y transporte.

## 📋 Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x

## ⚙️ Configuración

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en el directorio `frontend/`:

```bash
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Logística G12
```

## 🏃‍♂️ Ejecutar el Proyecto

### Modo Desarrollo
```bash
npm run dev
```

El servidor estará disponible en http://localhost:5173

### Modo Producción
```bash
npm run build
npm run preview
```

## 🧪 Testing

### Ejecutar Linter
```bash
npm run lint
```

### Formatear Código
```bash
npm run format
```

### Verificar Tipos
```bash
npm run check
```

## 📂 Estructura del Proyecto

```
frontend/
├── src/
│   ├── routes/                   # Páginas SvelteKit
│   │   ├── +layout.svelte       # Layout principal
│   │   ├── +page.svelte         # Página de inicio
│   │   ├── dashboard/           # Dashboard de logística
│   │   ├── shipping/            # Gestión de envíos
│   │   └── config/              # Configuración (admin)
│   │
│   ├── lib/
│   │   ├── components/          # Componentes reutilizables
│   │   ├── stores/              # Stores de Svelte
│   │   ├── services/            # Servicios para API
│   │   └── middleware/          # Middleware personalizado
│   │
│   ├── app.html                 # Template HTML base
│   └── app.d.ts                 # Tipos globales
│
├── static/                      # Assets estáticos
├── package.json                 # Dependencias
└── vite.config.js              # Configuración de Vite
```

## 🛠️ Tecnologías

- **SvelteKit**: Framework principal
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios
- **Vite**: Build tool y dev server

## 📡 Integración con Backend

El frontend se conecta al backend NestJS en:
- **API Externa**: `/api/shipping/*` - Gestión de envíos
- **API Interna**: `/api/config/*` - Configuración del sistema

## 🎯 Funcionalidades (Por Implementar)

### Páginas Principales
- [ ] Dashboard principal
- [ ] Gestión de envíos
- [ ] Seguimiento de envíos
- [ ] Configuración del sistema
- [ ] Reportes y estadísticas

### Componentes
- [ ] Formulario de envío
- [ ] Tabla de envíos
- [ ] Modal de detalles
- [ ] Gráficos de seguimiento
- [ ] Configuración de tarifas

## 🚀 Próximos Pasos

1. **Setup inicial**: Configurar SvelteKit y Tailwind
2. **Layout base**: Crear layout principal con navegación
3. **Páginas principales**: Implementar dashboard y gestión de envíos
4. **Integración API**: Conectar con endpoints del backend
5. **Componentes**: Crear componentes reutilizables
6. **Testing**: Implementar tests E2E

## 📚 Documentación

- [SvelteKit Docs](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [API Backend](../openapilog.yaml)

---

**Estado**: 🚧 En desarrollo - Estructura base creada

**Desarrolladores**: Frontend Team
