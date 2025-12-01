#!/usr/bin/env bash

# ===================================
# SCRIPT DE ESTADO DEL SISTEMA
# TPI Desarrollo de Software 2025
# ===================================

set -euo pipefail

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"

# Cargar configuración desde .env si existe
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
elif [ -f "$SCRIPT_DIR/env.example" ]; then
    echo "⚠️  Usando configuración de ejemplo. Copia env.example a .env para personalizar."
    source "$SCRIPT_DIR/env.example"
else
    echo "❌ No se encontró archivo de configuración. Crea .env basado en env.example"
    exit 1
fi

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Función para mostrar ayuda
show_help() {
    echo "📊 Script de Estado del Sistema"
    echo "==============================="
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  status                    - Estado completo del sistema"
    echo "  services                  - Estado de microservicios"
    echo "  shared                    - Estado de librerías compartidas"
    echo "  config                    - Estado de configuración"
    echo "  health                    - Health checks de servicios"
    echo "  summary                   - Resumen ejecutivo"
    echo "  help                      - Mostrar esta ayuda"
    echo ""
    echo "Opciones:"
    echo "  --verbose                 - Mostrar información detallada"
    echo "  --json                    - Salida en formato JSON"
    echo "  --quiet                   - Solo mostrar errores"
    echo ""
    echo "Ejemplos:"
    echo "  $0 status                 # Estado completo"
    echo "  $0 services                # Solo microservicios"
    echo "  $0 health                  # Solo health checks"
    echo "  $0 summary                 # Resumen ejecutivo"
    echo ""
}

# Función para verificar estado de microservicios
check_services_status() {
    log "Verificando estado de microservicios..."
    
    local services=("config-service" "stock-integration-service" "shipping-service" "operator-interface-service")
    local running=0
    local total=${#services[@]}
    
    for service in "${services[@]}"; do
        if [ -d "$BACKEND_DIR/services/$service" ]; then
            if [ -d "$BACKEND_DIR/services/$service/node_modules" ]; then
                if [ -d "$BACKEND_DIR/services/$service/dist" ]; then
                    success "$service: construido y listo"
                    ((running++))
                else
                    warning "$service: dependencias instaladas, no construido"
                fi
            else
                error "$service: dependencias no instaladas"
            fi
        else
            error "$service: directorio no encontrado"
        fi
    done
    
    echo "  📊 Servicios listos: $running/$total"
    return $((total - running))
}

# Función para verificar estado de librerías compartidas
check_shared_status() {
    log "Verificando estado de librerías compartidas..."
    
    local shared_libs=("database" "types" "utils")
    local ready=0
    local total=${#shared_libs[@]}
    
    for lib in "${shared_libs[@]}"; do
        if [ -d "$BACKEND_DIR/shared/$lib" ]; then
            if [ -d "$BACKEND_DIR/shared/$lib/node_modules" ]; then
                if [ -d "$BACKEND_DIR/shared/$lib/dist" ]; then
                    success "$lib: construido y listo"
                    ((ready++))
                else
                    warning "$lib: dependencias instaladas, no construido"
                fi
            else
                error "$lib: dependencias no instaladas"
            fi
        else
            error "$lib: directorio no encontrado"
        fi
    done
    
    echo "  📊 Librerías listas: $ready/$total"
    return $((total - ready))
}

# Función para verificar configuración
check_config_status() {
    log "Verificando estado de configuración..."
    
    local config_ok=true
    
    # Verificar archivo .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        success "Archivo .env encontrado"
    else
        error "Archivo .env no encontrado"
        config_ok=false
    fi
    
    # Verificar variables críticas
    local critical_vars=("ENVIRONMENT" "CONFIG_SERVICE_URL" "SHIPPING_SERVICE_URL" "STOCK_INTEGRATION_SERVICE_URL" "OPERATOR_INTERFACE_SERVICE_URL")
    
    for var in "${critical_vars[@]}"; do
        if [ -n "${!var:-}" ]; then
            success "Variable $var configurada"
        else
            error "Variable $var no configurada"
            config_ok=false
        fi
    done
    
    # Verificar prerrequisitos
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        success "Node.js: $node_version"
    else
        error "Node.js no encontrado"
        config_ok=false
    fi
    
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        success "npm: $npm_version"
    else
        error "npm no encontrado"
        config_ok=false
    fi
    
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version)
        success "Docker: $docker_version"
    else
        warning "Docker no encontrado (opcional)"
    fi
    
    if [ "$config_ok" = true ]; then
        return 0
    else
        return 1
    fi
}

# Función para health checks
check_health() {
    log "Ejecutando health checks..."
    
    # Determinar URLs según el entorno
    if [ "${ENVIRONMENT:-development}" = "development" ]; then
        local services=(
            "${CONFIG_SERVICE_URL}/health:Config Service"
            "${STOCK_INTEGRATION_SERVICE_URL}/health:Stock Integration Service"
            "${SHIPPING_SERVICE_URL}/health:Shipping Service"
            "${OPERATOR_INTERFACE_SERVICE_URL}/health:Operator Interface Service"
        )
    else
        local services=(
            "${CONFIG_SERVICE_URL_DEPLOYED}/health:Config Service"
            "${STOCK_INTEGRATION_SERVICE_URL_DEPLOYED}/health:Stock Integration Service"
            "${SHIPPING_SERVICE_URL_DEPLOYED}/health:Shipping Service"
            "${OPERATOR_INTERFACE_SERVICE_URL_DEPLOYED}/health:Operator Interface Service"
        )
    fi
    
    local healthy=0
    local total=${#services[@]}
    
    for service_info in "${services[@]}"; do
        local url="${service_info%%:*}"
        local name="${service_info##*:}"
        
        if curl -f -s "$url" > /dev/null 2>&1; then
            success "$name está funcionando"
            ((healthy++))
        else
            error "$name no está respondiendo"
        fi
    done
    
    echo "  📊 Servicios saludables: $healthy/$total"
    return $((total - healthy))
}

# Función para resumen ejecutivo
show_summary() {
    echo -e "${PURPLE}📊 RESUMEN EJECUTIVO DEL SISTEMA${NC}"
    echo -e "${PURPLE}=================================${NC}"
    echo ""
    
    # Estado general
    local overall_status="🟢 OPERATIVO"
    local issues=0
    
    # Verificar configuración
    if ! check_config_status > /dev/null 2>&1; then
        overall_status="🔴 CONFIGURACIÓN INCOMPLETA"
        ((issues++))
    fi
    
    # Verificar librerías compartidas
    if ! check_shared_status > /dev/null 2>&1; then
        overall_status="🟡 PARCIALMENTE OPERATIVO"
        ((issues++))
    fi
    
    # Verificar microservicios
    if ! check_services_status > /dev/null 2>&1; then
        overall_status="🟡 PARCIALMENTE OPERATIVO"
        ((issues++))
    fi
    
    # Verificar health
    if ! check_health > /dev/null 2>&1; then
        overall_status="🔴 SERVICIOS NO RESPONDIENDO"
        ((issues++))
    fi
    
    echo -e "${CYAN}Estado General: $overall_status${NC}"
    echo -e "${CYAN}Problemas detectados: $issues${NC}"
    echo ""
    
    # Información del sistema
    echo -e "${YELLOW}Información del Sistema:${NC}"
    echo "  🏠 Directorio: $PROJECT_ROOT"
    echo "  🔧 Entorno: ${ENVIRONMENT:-development}"
    echo "  📅 Fecha: $(date)"
    echo "  👤 Usuario: $(whoami)"
    echo ""
    
    # Próximos pasos
    if [ $issues -gt 0 ]; then
        echo -e "${YELLOW}Próximos pasos recomendados:${NC}"
        if [ $issues -ge 1 ]; then
            echo "  1. Ejecutar setup inicial: ./scripts/setup.sh init"
        fi
        if [ $issues -ge 2 ]; then
            echo "  2. Construir librerías: ./scripts/build-shared.sh build"
        fi
        if [ $issues -ge 3 ]; then
            echo "  3. Iniciar servicios: ./scripts/microservices.sh dev"
        fi
        if [ $issues -ge 4 ]; then
            echo "  4. Verificar health: ./scripts/status.sh health"
        fi
    else
        echo -e "${GREEN}🎉 ¡Sistema completamente operativo!${NC}"
        echo "  • Todos los servicios están funcionando"
        echo "  • Configuración válida"
        echo "  • Librerías construidas"
        echo "  • Microservicios listos"
    fi
    echo ""
}

# Función para estado completo
show_full_status() {
    echo -e "${PURPLE}📊 ESTADO COMPLETO DEL SISTEMA${NC}"
    echo -e "${PURPLE}===============================${NC}"
    echo ""
    
    # Configuración
    echo -e "${CYAN}🔧 CONFIGURACIÓN${NC}"
    echo "================"
    check_config_status
    echo ""
    
    # Librerías compartidas
    echo -e "${CYAN}📚 LIBRERÍAS COMPARTIDAS${NC}"
    echo "========================="
    check_shared_status
    echo ""
    
    # Microservicios
    echo -e "${CYAN}🚀 MICROSERVICIOS${NC}"
    echo "=================="
    check_services_status
    echo ""
    
    # Health checks
    echo -e "${CYAN}🏥 HEALTH CHECKS${NC}"
    echo "=================="
    check_health
    echo ""
}

# Función principal
main() {
    local command="${1:-status}"
    shift || true
    
    # Procesar opciones
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                set -x
                shift
                ;;
            --json)
                # TODO: Implementar salida JSON
                shift
                ;;
            --quiet)
                # TODO: Implementar modo quiet
                shift
                ;;
            *)
                error "Opción desconocida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Ejecutar comando
    case $command in
        "status")
            show_full_status
            ;;
        "services")
            check_services_status
            ;;
        "shared")
            check_shared_status
            ;;
        "config")
            check_config_status
            ;;
        "health")
            check_health
            ;;
        "summary")
            show_summary
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            error "Comando desconocido: $command"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
