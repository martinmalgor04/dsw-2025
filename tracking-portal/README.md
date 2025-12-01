# Portal de Seguimiento de Envíos

Aplicación web independiente para consultar el estado de envíos de logística.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp env.example .env
```

3. Ejecutar en modo desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3010`

### Build para producción

```bash
npm run build
```

Los archivos de producción estarán en la carpeta `dist/`.

## 📋 Características

- **Búsqueda por código**: Consulta envíos por ID o número de seguimiento
- **Lista de envíos disponibles**: Ver todos los envíos existentes para testing
- **Vista detallada**: Información completa del envío (estado, direcciones, costo, timeline)
- **Timeline interactiva**: Historial de estados con visualización cronológica
- **Responsive**: Optimizado para móvil y desktop
- **Independiente**: No requiere autenticación

## 🏗️ Arquitectura

### Tecnologías
- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **Tailwind CSS** para estilos
- **Axios** para llamadas API
- **Lucide React** para iconos

### Estructura
```
src/
├── components/     # Componentes React
├── services/       # Cliente API
├── types/         # Definiciones TypeScript
├── utils/         # Utilitarios
└── App.tsx        # Componente principal
```

## 🔧 Configuración

### Variables de Entorno
- `VITE_API_URL`: URL base de la API de logística (default: https://api.logistica-utn.com)

**Importante**: La aplicación consume directamente de la API de logística (`https://api.logistica-utn.com`). Si aparecen errores de "Envío no encontrado", significa que:
- No hay envíos creados en la base de datos
- La API no está disponible temporalmente
- Hay un problema de conectividad

### API Endpoints Utilizados
- `GET /shipping`: Listar envíos disponibles (para testing)
- `GET /shipping/{shipping_id}`: Obtener detalles del envío

## 📱 Uso

### Consulta por Código
1. Ingresar el código de envío en el campo de búsqueda
2. Hacer clic en "Rastrear Envío"
3. Visualizar la información completa y el historial

### Ver Envíos Disponibles (Testing)
1. Hacer clic en "Ver Envíos Disponibles"
2. Seleccionar cualquier envío de la lista
3. Visualizar automáticamente sus detalles completos

Esta funcionalidad es útil para desarrollo y testing, permitiendo ver qué envíos existen en el sistema.

## 🚢 Deployment

Esta aplicación está diseñada para ser desplegada de forma independiente al frontend principal. Puede alojarse en:

- **Vercel**
- **Netlify**
- **Servidor web estático**
- **CDN**

### Build Estático

```bash
npm run build
```

El contenido de `dist/` puede subirse directamente a cualquier hosting estático.

## 🤝 Contribución

Este proyecto es parte del sistema de logística DSW-2025. Para contribuciones, seguir el flujo de trabajo del proyecto principal.
