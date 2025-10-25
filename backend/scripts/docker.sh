#!/usr/bin/env bash

# ===================================
# SCRIPT DE GESTIÓN DOCKER
# TPI Desarrollo de Software 2025
# ===================================

set -euo pipefail

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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
    echo "🐳 Script de Gestión Docker"
    echo "============================"
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  build                     - Construir todas las imágenes"
    echo "  build-service <nombre>    - Construir imagen de servicio específico"
    echo "  up                        - Levantar todos los servicios"
    echo "  up-dev                    - Levantar servicios en modo desarrollo"
    echo "  down                      - Detener todos los servicios"
    echo "  restart                   - Reiniciar todos los servicios"
    echo "  logs                      - Ver logs de todos los servicios"
    echo "  logs-service <nombre>     - Ver logs de servicio específico"
    echo "  status                    - Ver estado de servicios"
    echo "  health                    - Verificar health de servicios"
    echo "  clean                     - Limpiar containers, imágenes y volúmenes"
    echo "  shell <servicio>          - Abrir shell en servicio"
    echo "  help                      - Mostrar esta ayuda"
    echo ""
    echo "Opciones:"
    echo "  --force                   - Forzar rebuild de imágenes"
    echo "  --no-cache                - Construir sin cache"
    echo "  --parallel                - Construir imágenes en paralelo"
    echo "  --verbose                 - Mostrar output detallado"
    echo ""
    echo "Ejemplos:"
    echo "  $0 build                  # Construir todas las imágenes"
    echo "  $0 up-dev                 # Levantar en modo desarrollo"
    echo "  $0 logs-service frontend  # Ver logs del frontend"
    echo "  $0 shell postgres         # Abrir shell en postgres"
    echo ""
}

# Función para verificar Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker no está ejecutándose"
        exit 1
    fi
}

# Función para construir imágenes
build_images() {
    log "Construyendo imágenes Docker..."
    
    local services=("config-service" "stock-integration-service" "shipping-service" "operator-interface-service" "frontend")
    local failed=0
    
    for service in "${services[@]}"; do
        log "Construyendo imagen de $service..."
        
        if [ "$service" = "frontend" ]; then
            cd "$PROJECT_ROOT/frontend"
            if docker build -t "logistics-$service:latest" .; then
                success "Imagen de $service construida"
            else
                error "Error construyendo imagen de $service"
                ((failed++))
            fi
        else
            cd "$PROJECT_ROOT/backend"
            if docker build -f "services/$service/Dockerfile" -t "logistics-$service:latest" .; then
                success "Imagen de $service construida"
            else
                error "Error construyendo imagen de $service"
                ((failed++))
            fi
        fi
    done
    
    if [ $failed -eq 0 ]; then
        success "Todas las imágenes construidas"
        return 0
    else
        error "Error construyendo imágenes ($failed fallos)"
        return 1
    fi
}

# Función para construir servicio específico
build_service() {
    local service="$1"
    
    if [ -z "$service" ]; then
        error "Especifica el nombre del servicio"
        echo "Servicios disponibles: config-service, stock-integration-service, shipping-service, operator-interface-service, frontend"
        exit 1
    fi
    
    log "Construyendo imagen de $service..."
    
    if [ "$service" = "frontend" ]; then
        cd "$PROJECT_ROOT/frontend"
        if docker build -t "logistics-$service:latest" .; then
            success "Imagen de $service construida"
        else
            error "Error construyendo imagen de $service"
            return 1
        fi
    else
        cd "$PROJECT_ROOT"
        if docker build -f "services/$service/Dockerfile" -t "logistics-$service:latest" .; then
            success "Imagen de $service construida"
        else
            error "Error construyendo imagen de $service"
            return 1
        fi
    fi
}

# Función para levantar servicios
up_services() {
    local mode="${1:-production}"
    
    log "Levantando servicios en modo $mode..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$mode" = "development" ]; then
        if docker-compose -f docker-compose.dev.yml up -d; then
            success "Servicios de desarrollo levantados"
        else
            error "Error levantando servicios de desarrollo"
            return 1
        fi
    else
        if docker-compose up -d; then
            success "Servicios de producción levantados"
        else
            error "Error levantando servicios de producción"
            return 1
        fi
    fi
}

# Función para detener servicios
down_services() {
    log "Deteniendo servicios..."
    
    cd "$PROJECT_ROOT"
    
    # Detener servicios de desarrollo
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Detener servicios de producción
    docker-compose down 2>/dev/null || true
    
    success "Servicios detenidos"
}

# Función para reiniciar servicios
restart_services() {
    log "Reiniciando servicios..."
    
    down_services
    sleep 2
    up_services
}

# Función para ver logs
show_logs() {
    local service="$1"
    
    cd "$PROJECT_ROOT"
    
    if [ -z "$service" ]; then
        log "Mostrando logs de todos los servicios..."
        docker-compose logs -f
    else
        log "Mostrando logs de $service..."
        docker-compose logs -f "$service"
    fi
}

# Función para ver estado
show_status() {
    log "Estado de servicios Docker:"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    echo -e "${CYAN}🐳 CONTAINERS${NC}"
    echo "=============="
    docker-compose ps
    echo ""
    
    echo -e "${CYAN}📊 IMAGES${NC}"
    echo "============"
    docker images | grep logistics || echo "No hay imágenes de logistics"
    echo ""
    
    echo -e "${CYAN}💾 VOLUMES${NC}"
    echo "============"
    docker volume ls | grep logistics || echo "No hay volúmenes de logistics"
    echo ""
}

# Función para health check
check_health() {
    log "Verificando health de servicios..."
    
    local services=("config-service" "stock-integration-service" "shipping-service" "operator-interface-service" "frontend")
    local healthy=0
    local total=${#services[@]}
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            success "$service está funcionando"
            ((healthy++))
        else
            error "$service no está funcionando"
        fi
    done
    
    echo "  📊 Servicios saludables: $healthy/$total"
    
    if [ $healthy -eq $total ]; then
        success "Todos los servicios están funcionando"
        return 0
    else
        error "Algunos servicios no están funcionando"
        return 1
    fi
}

# Función para limpiar
clean_docker() {
    log "Limpiando Docker..."
    
    # Detener servicios
    down_services
    
    # Eliminar containers
    docker container prune -f
    
    # Eliminar imágenes
    docker image prune -f
    
    # Eliminar volúmenes
    docker volume prune -f
    
    # Eliminar redes
    docker network prune -f
    
    success "Docker limpiado"
}

# Función para abrir shell
open_shell() {
    local service="$1"
    
    if [ -z "$service" ]; then
        error "Especifica el nombre del servicio"
        echo "Servicios disponibles: postgres, redis, config-service, stock-integration-service, shipping-service, operator-interface-service, frontend"
        exit 1
    fi
    
    log "Abriendo shell en $service..."
    
    if docker-compose exec "$service" /bin/sh; then
        success "Shell cerrado"
    else
        error "Error abriendo shell en $service"
        return 1
    fi
}

# Función principal
main() {
    local command="${1:-help}"
    shift || true
    
    # Variables para opciones
    local service_name=""
    local options=()
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_BUILD=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            --parallel)
                PARALLEL_BUILD=true
                shift
                ;;
            --verbose)
                set -x
                shift
                ;;
            *)
                # Si no es una opción, es el nombre del servicio
                if [ -z "$service_name" ]; then
                    service_name="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Verificar Docker
    check_docker
    
    # Ejecutar comando
    case $command in
        "build")
            build_images
            ;;
        "build-service")
            build_service "$service_name"
            ;;
        "up")
            up_services "production"
            ;;
        "up-dev")
            up_services "development"
            ;;
        "down")
            down_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs "$service_name"
            ;;
        "logs-service")
            show_logs "$service_name"
            ;;
        "status")
            show_status
            ;;
        "health")
            check_health
            ;;
        "clean")
            clean_docker
            ;;
        "shell")
            open_shell "$service_name"
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
