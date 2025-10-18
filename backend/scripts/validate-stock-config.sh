#!/bin/bash

# Script para validar configuración de Stock Integration
# Uso: ./scripts/validate-stock-config.sh [environment]

set -e

ENVIRONMENT=${1:-development}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔍 Validando configuración de Stock Integration para entorno: $ENVIRONMENT"
echo "📁 Directorio del proyecto: $PROJECT_ROOT"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar errores
show_error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Función para mostrar advertencias
show_warning() {
    echo -e "${YELLOW}⚠️  Advertencia: $1${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Verificar si existe el archivo .env
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
    show_error "Archivo .env no encontrado en $ENV_FILE"
fi

echo "📄 Archivo .env encontrado: $ENV_FILE"

# Variables requeridas para Stock Integration
REQUIRED_VARS=(
    "STOCK_API_URL"
    "STOCK_API_TIMEOUT"
    "STOCK_API_RETRY_ATTEMPTS"
    "STOCK_API_RETRY_DELAY"
    "STOCK_CIRCUIT_BREAKER_THRESHOLD"
    "STOCK_CIRCUIT_BREAKER_TIMEOUT"
    "STOCK_CACHE_TTL"
    "STOCK_CACHE_MAX_ITEMS"
    "KEYCLOAK_URL"
    "KEYCLOAK_REALM"
    "KEYCLOAK_CLIENT_ID"
    "KEYCLOAK_CLIENT_SECRET"
    "KEYCLOAK_GRANT_TYPE"
)

# Variables opcionales para Redis
OPTIONAL_VARS=(
    "REDIS_HOST"
    "REDIS_PORT"
    "REDIS_PASSWORD"
    "REDIS_DB"
)

echo "🔧 Validando variables requeridas..."

# Validar variables requeridas
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" "$ENV_FILE"; then
        MISSING_VARS+=("$var")
    else
        VALUE=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -z "$VALUE" ]; then
            MISSING_VARS+=("$var")
        else
            show_success "$var está configurado"
        fi
    fi
done

# Mostrar variables faltantes
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Variables faltantes o vacías:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}   - $var${NC}"
    done
    echo ""
    echo "💡 Agrega estas variables al archivo .env:"
    echo "   cp env.example .env"
    echo "   # Luego edita .env con los valores correctos"
    exit 1
fi

echo "🔧 Validando variables opcionales..."

# Validar variables opcionales
for var in "${OPTIONAL_VARS[@]}"; do
    if grep -q "^${var}=" "$ENV_FILE"; then
        VALUE=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$VALUE" ]; then
            show_success "$var está configurado (opcional)"
        fi
    else
        show_warning "$var no está configurado (opcional)"
    fi
done

echo ""
echo "🔍 Validando formatos de URLs..."

# Validar formato de STOCK_API_URL
STOCK_API_URL=$(grep "^STOCK_API_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [[ ! "$STOCK_API_URL" =~ ^https?:// ]]; then
    show_error "STOCK_API_URL debe ser una URL válida (http:// o https://)"
fi
show_success "STOCK_API_URL tiene formato válido: $STOCK_API_URL"

# Validar formato de KEYCLOAK_URL
KEYCLOAK_URL=$(grep "^KEYCLOAK_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [[ ! "$KEYCLOAK_URL" =~ ^https?:// ]]; then
    show_error "KEYCLOAK_URL debe ser una URL válida (http:// o https://)"
fi
show_success "KEYCLOAK_URL tiene formato válido: $KEYCLOAK_URL"

echo ""
echo "🔍 Validando valores numéricos..."

# Validar valores numéricos
NUMERIC_VARS=(
    "STOCK_API_TIMEOUT:1000:10000"
    "STOCK_API_RETRY_ATTEMPTS:1:5"
    "STOCK_API_RETRY_DELAY:500:5000"
    "STOCK_CIRCUIT_BREAKER_THRESHOLD:1:10"
    "STOCK_CIRCUIT_BREAKER_TIMEOUT:10000:120000"
    "STOCK_CACHE_TTL:60:3600"
    "STOCK_CACHE_MAX_ITEMS:100:10000"
)

for var_range in "${NUMERIC_VARS[@]}"; do
    IFS=':' read -r var min max <<< "$var_range"
    VALUE=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if ! [[ "$VALUE" =~ ^[0-9]+$ ]]; then
        show_error "$var debe ser un número entero"
    fi
    
    if [ "$VALUE" -lt "$min" ] || [ "$VALUE" -gt "$max" ]; then
        show_error "$var debe estar entre $min y $max (valor actual: $VALUE)"
    fi
    
    show_success "$var tiene valor válido: $VALUE"
done

echo ""
echo "🔍 Validando configuración de Redis (si está presente)..."

# Validar Redis si está configurado
if grep -q "^REDIS_HOST=" "$ENV_FILE"; then
    REDIS_HOST=$(grep "^REDIS_HOST=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$REDIS_HOST" ]; then
        show_success "Redis configurado con host: $REDIS_HOST"
        
        # Validar puerto de Redis
        if grep -q "^REDIS_PORT=" "$ENV_FILE"; then
            REDIS_PORT=$(grep "^REDIS_PORT=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [[ "$REDIS_PORT" =~ ^[0-9]+$ ]] && [ "$REDIS_PORT" -ge 1024 ] && [ "$REDIS_PORT" -le 65535 ]; then
                show_success "Puerto de Redis válido: $REDIS_PORT"
            else
                show_error "REDIS_PORT debe ser un puerto válido (1024-65535)"
            fi
        fi
    fi
else
    show_warning "Redis no está configurado, se usará caché en memoria"
fi

echo ""
echo "🔍 Validando configuración de Keycloak..."

# Validar configuración de Keycloak
KEYCLOAK_REALM=$(grep "^KEYCLOAK_REALM=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
KEYCLOAK_CLIENT_ID=$(grep "^KEYCLOAK_CLIENT_ID=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
KEYCLOAK_CLIENT_SECRET=$(grep "^KEYCLOAK_CLIENT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
KEYCLOAK_GRANT_TYPE=$(grep "^KEYCLOAK_GRANT_TYPE=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$KEYCLOAK_REALM" ]; then
    show_error "KEYCLOAK_REALM no puede estar vacío"
fi

if [ -z "$KEYCLOAK_CLIENT_ID" ]; then
    show_error "KEYCLOAK_CLIENT_ID no puede estar vacío"
fi

if [ -z "$KEYCLOAK_CLIENT_SECRET" ]; then
    show_error "KEYCLOAK_CLIENT_SECRET no puede estar vacío"
fi

if [ "$KEYCLOAK_GRANT_TYPE" != "client_credentials" ]; then
    show_warning "KEYCLOAK_GRANT_TYPE debería ser 'client_credentials' (valor actual: $KEYCLOAK_GRANT_TYPE)"
fi

show_success "Configuración de Keycloak válida"

echo ""
echo "🔍 Validando conectividad (opcional)..."

# Test de conectividad opcional
if command -v curl &> /dev/null; then
    echo "🌐 Probando conectividad con Stock API..."
    
    # Extraer host de STOCK_API_URL
    STOCK_HOST=$(echo "$STOCK_API_URL" | sed -E 's|^https?://([^/]+).*|\1|')
    
    if ping -c 1 -W 3 "$STOCK_HOST" &> /dev/null; then
        show_success "Stock API host es alcanzable: $STOCK_HOST"
    else
        show_warning "No se puede alcanzar el host de Stock API: $STOCK_HOST"
    fi
else
    show_warning "curl no está disponible, saltando test de conectividad"
fi

echo ""
echo "🎉 ¡Validación completada exitosamente!"
echo ""
echo "📋 Resumen:"
echo "   ✅ Todas las variables requeridas están configuradas"
echo "   ✅ Formatos de URLs son válidos"
echo "   ✅ Valores numéricos están en rangos aceptables"
echo "   ✅ Configuración de Keycloak es válida"
echo ""
echo "🚀 El módulo de Stock Integration está listo para usar"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Ejecutar tests: npm test"
echo "   2. Iniciar la aplicación: npm run start:dev"
echo "   3. Verificar health check: curl http://localhost:3000/health"
