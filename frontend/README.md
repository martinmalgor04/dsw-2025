# LogiX Frontend

Frontend de Gestión Logística - Despliegue Independiente

## 🚀 Despliegue Rápido

### Con Docker:
```bash
# Build
docker build -t logix-frontend .

# Run
docker run -p 80:80 logix-frontend
```

### Con npm:
```bash
# Install
npm install

# Development
npm run dev

# Production build
npm run build
```

## 🔧 Variables de Entorno

```bash
VITE_API_URL=http://144.22.130.30:3004
VITE_OPERATOR_URL=http://144.22.130.30:3004
VITE_CONFIG_URL=http://144.22.130.30:3003
VITE_SHIPPING_URL=http://144.22.130.30:3001
VITE_STOCK_URL=http://144.22.130.30:3002
```

## 📁 Estructura

```
frontend/
├── src/                    # Código fuente
├── public/                 # Archivos públicos
├── Dockerfile             # Configuración Docker
├── nginx.conf             # Configuración Nginx
├── package.json           # Dependencias
└── README.md              # Documentación
```

## 🌐 URLs de Microservicios

- **Operator Interface:** http://144.22.130.30:3004
- **Config Service:** http://144.22.130.30:3003
- **Shipping Service:** http://144.22.130.30:3001
- **Stock Service:** http://144.22.130.30:3002