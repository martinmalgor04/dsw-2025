#!/bin/bash

# ===================================
# CONFIGURACIÓN DE TESTING - MICROSERVICIOS
# TPI Desarrollo de Software 2025
# ===================================

# Configuración de microservicios
declare -A MICROSERVICES=(
    ["config-service"]="http://localhost:3003"
    ["stock-integration-service"]="http://localhost:3002"
    ["shipping-service"]="http://localhost:3001"
    ["operator-interface-service"]="http://localhost:3004"
)

# Configuración de URLs externas
export EXTERNAL_URL="${EXTERNAL_URL:-http://localhost:3000}"

# Configuración de base de datos
export DATABASE_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/logistics}"
export DIRECT_URL="${DIRECT_URL:-postgresql://user:password@localhost:5432/logistics}"

# Configuración de Redis
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# Configuración de APIs externas
export STOCK_API_URL="${STOCK_API_URL:-http://localhost:3002}"
export COMPRAS_API_URL="${COMPRAS_API_URL:-http://localhost:3002}"

# Configuración de Keycloak
export KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
export KEYCLOAK_REALM="${KEYCLOAK_REALM:-logistics}"
export KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-logistics-api}"

# Configuración de geolocalización
export DISTANCE_API_URL="${DISTANCE_API_URL:-https://api.distancematrix.ai}"
export DISTANCE_API_KEY="${DISTANCE_API_KEY:-your-api-key}"

# Configuración de cache
export PRODUCT_CACHE_TTL="${PRODUCT_CACHE_TTL:-600}"
export DISTANCE_CACHE_TTL="${DISTANCE_CACHE_TTL:-3600}"
export STOCK_CACHE_TTL="${STOCK_CACHE_TTL:-600}"
export STOCK_CACHE_MAX_ITEMS="${STOCK_CACHE_MAX_ITEMS:-1000}"

# Configuración de timeouts
export QUOTE_TIMEOUT="${QUOTE_TIMEOUT:-30000}"
export STOCK_TIMEOUT="${STOCK_TIMEOUT:-10000}"

# Configuración de circuit breaker
export CIRCUIT_BREAKER_THRESHOLD="${CIRCUIT_BREAKER_THRESHOLD:-5}"
export CIRCUIT_BREAKER_TIMEOUT="${CIRCUIT_BREAKER_TIMEOUT:-60000}"

# Configuración de retry
export MAX_RETRIES="${MAX_RETRIES:-3}"
export RETRY_DELAY="${RETRY_DELAY:-1000}"

# Configuración de logging
export LOG_LEVEL="${LOG_LEVEL:-info}"
export LOG_FORMAT="${LOG_FORMAT:-json}"

# Configuración de testing
export TEST_TIMEOUT="${TEST_TIMEOUT:-30000}"
export TEST_RETRIES="${TEST_RETRIES:-3}"

# Función para mostrar configuración
show_config() {
    echo "🔧 Configuración de Testing - Microservicios:"
    echo "=============================================="
    echo ""
    echo "📡 Microservicios:"
    for service in "${!MICROSERVICES[@]}"; do
        echo "   $service: ${MICROSERVICES[$service]}"
    done
    echo ""
    echo "🌐 URLs Externas:"
    echo "   EXTERNAL_URL: $EXTERNAL_URL"
    echo "   STOCK_API_URL: $STOCK_API_URL"
    echo "   COMPRAS_API_URL: $COMPRAS_API_URL"
    echo ""
    echo "🗄️  Base de Datos:"
    echo "   DATABASE_URL: $DATABASE_URL"
    echo "   DIRECT_URL: $DIRECT_URL"
    echo ""
    echo "🔴 Redis:"
    echo "   REDIS_URL: $REDIS_URL"
    echo ""
    echo "🔐 Keycloak:"
    echo "   KEYCLOAK_URL: $KEYCLOAK_URL"
    echo "   KEYCLOAK_REALM: $KEYCLOAK_REALM"
    echo "   KEYCLOAK_CLIENT_ID: $KEYCLOAK_CLIENT_ID"
    echo ""
    echo "🗺️  Geolocalización:"
    echo "   DISTANCE_API_URL: $DISTANCE_API_URL"
    echo "   DISTANCE_API_KEY: $DISTANCE_API_KEY"
    echo ""
    echo "💾 Cache:"
    echo "   PRODUCT_CACHE_TTL: $PRODUCT_CACHE_TTL"
    echo "   DISTANCE_CACHE_TTL: $DISTANCE_CACHE_TTL"
    echo "   STOCK_CACHE_TTL: $STOCK_CACHE_TTL"
    echo "   STOCK_CACHE_MAX_ITEMS: $STOCK_CACHE_MAX_ITEMS"
    echo ""
    echo "⏱️  Timeouts:"
    echo "   QUOTE_TIMEOUT: $QUOTE_TIMEOUT"
    echo "   STOCK_TIMEOUT: $STOCK_TIMEOUT"
    echo ""
    echo "🔄 Circuit Breaker:"
    echo "   CIRCUIT_BREAKER_THRESHOLD: $CIRCUIT_BREAKER_THRESHOLD"
    echo "   CIRCUIT_BREAKER_TIMEOUT: $CIRCUIT_BREAKER_TIMEOUT"
    echo ""
    echo "🔄 Retry:"
    echo "   MAX_RETRIES: $MAX_RETRIES"
    echo "   RETRY_DELAY: $RETRY_DELAY"
    echo ""
    echo "📝 Logging:"
    echo "   LOG_LEVEL: $LOG_LEVEL"
    echo "   LOG_FORMAT: $LOG_FORMAT"
    echo ""
    echo "🧪 Testing:"
    echo "   TEST_TIMEOUT: $TEST_TIMEOUT"
    echo "   TEST_RETRIES: $TEST_RETRIES"
    echo ""
}

# Función para validar configuración
validate_config() {
    echo "🔍 Validando configuración de testing..."
    echo "========================================"
    
    local errors=0
    
    # Validar URLs de microservicios
    for service in "${!MICROSERVICES[@]}"; do
        local url="${MICROSERVICES[$service]}"
        if [[ ! "$url" =~ ^https?:// ]]; then
            echo "❌ URL inválida para $service: $url"
            ((errors++))
        fi
    done
    
    # Validar URLs externas
    if [[ ! "$EXTERNAL_URL" =~ ^https?:// ]]; then
        echo "❌ EXTERNAL_URL inválida: $EXTERNAL_URL"
        ((errors++))
    fi
    
    # Validar URLs de base de datos
    if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
        echo "❌ DATABASE_URL inválida: $DATABASE_URL"
        ((errors++))
    fi
    
    # Validar URLs de Redis
    if [[ ! "$REDIS_URL" =~ ^redis:// ]]; then
        echo "❌ REDIS_URL inválida: $REDIS_URL"
        ((errors++))
    fi
    
    # Validar timeouts
    if [[ ! "$QUOTE_TIMEOUT" =~ ^[0-9]+$ ]]; then
        echo "❌ QUOTE_TIMEOUT debe ser un número: $QUOTE_TIMEOUT"
        ((errors++))
    fi
    
    if [[ ! "$STOCK_TIMEOUT" =~ ^[0-9]+$ ]]; then
        echo "❌ STOCK_TIMEOUT debe ser un número: $STOCK_TIMEOUT"
        ((errors++))
    fi
    
    # Validar cache TTL
    if [[ ! "$PRODUCT_CACHE_TTL" =~ ^[0-9]+$ ]]; then
        echo "❌ PRODUCT_CACHE_TTL debe ser un número: $PRODUCT_CACHE_TTL"
        ((errors++))
    fi
    
    if [[ ! "$DISTANCE_CACHE_TTL" =~ ^[0-9]+$ ]]; then
        echo "❌ DISTANCE_CACHE_TTL debe ser un número: $DISTANCE_CACHE_TTL"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        echo "✅ Configuración válida"
        return 0
    else
        echo "❌ Configuración inválida ($errors errores)"
        return 1
    fi
}

# Función para cargar configuración desde archivo
load_config_file() {
    local config_file="${1:-.env.test}"
    
    if [ -f "$config_file" ]; then
        echo "📁 Cargando configuración desde $config_file..."
        source "$config_file"
        echo "✅ Configuración cargada desde $config_file"
    else
        echo "⚠️  Archivo de configuración no encontrado: $config_file"
    fi
}

# Función para exportar configuración
export_config() {
    echo "📤 Exportando configuración de testing..."
    
    # Exportar variables de entorno
    export EXTERNAL_URL
    export DATABASE_URL
    export DIRECT_URL
    export REDIS_URL
    export STOCK_API_URL
    export COMPRAS_API_URL
    export KEYCLOAK_URL
    export KEYCLOAK_REALM
    export KEYCLOAK_CLIENT_ID
    export DISTANCE_API_URL
    export DISTANCE_API_KEY
    export PRODUCT_CACHE_TTL
    export DISTANCE_CACHE_TTL
    export STOCK_CACHE_TTL
    export STOCK_CACHE_MAX_ITEMS
    export QUOTE_TIMEOUT
    export STOCK_TIMEOUT
    export CIRCUIT_BREAKER_THRESHOLD
    export CIRCUIT_BREAKER_TIMEOUT
    export MAX_RETRIES
    export RETRY_DELAY
    export LOG_LEVEL
    export LOG_FORMAT
    export TEST_TIMEOUT
    export TEST_RETRIES
    
    echo "✅ Configuración exportada"
}

# Función para mostrar ayuda
show_help() {
    echo "🔧 Configuración de Testing - Microservicios"
    echo "============================================="
    echo ""
    echo "Uso:"
    echo "  source testing-config.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  show        - Mostrar configuración actual"
    echo "  validate    - Validar configuración"
    echo "  load [file] - Cargar configuración desde archivo"
    echo "  export      - Exportar variables de entorno"
    echo "  help        - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  source testing-config.sh show"
    echo "  source testing-config.sh validate"
    echo "  source testing-config.sh load .env.test"
    echo "  source testing-config.sh export"
    echo ""
}

# Función principal
main() {
    local command="${1:-show}"
    
    case $command in
        "show")
            show_config
            ;;
        "validate")
            validate_config
            ;;
        "load")
            load_config_file "$2"
            ;;
        "export")
            export_config
            ;;
        "help")
            show_help
            ;;
        *)
            echo "❌ Comando desconocido: $command"
            show_help
            ;;
    esac
}

# Si se ejecuta directamente, ejecutar función principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

# Exportar configuración por defecto
export_config