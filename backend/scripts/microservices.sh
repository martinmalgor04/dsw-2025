#!/bin/bash

# Script para manejar microservicios de logística
# Uso: ./scripts/microservices.sh [comando]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Verificar que Docker esté funcionando
check_docker() {
    if ! docker --version &> /dev/null; then
        error "Docker no está instalado o no está funcionando"
        exit 1
    fi
    
    if ! docker-compose --version &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
}

# Compilar shared libraries
build_shared() {
    log "Compilando bibliotecas compartidas..."
    
    cd shared/database && npm install && npm run build
    cd ../types && npm install && npm run build
    cd ../utils && npm install && npm run build
    cd ../..
    
    success "Bibliotecas compartidas compiladas"
}

# Compilar todos los servicios
build_services() {
    log "Compilando todos los microservicios..."
    
    services=("config-service" "stock-integration-service" "shipping-service" "operator-interface-service")
    
    for service in "${services[@]}"; do
        log "Compilando $service..."
        cd "services/$service"
        npm run build
        cd ../..
        success "$service compilado"
    done
}

# Ejecutar todos los servicios en modo desarrollo
dev() {
    log "Iniciando todos los microservicios en modo desarrollo..."
    check_docker
    
    # Asegurar que las shared libs estén compiladas
    build_shared
    
    # Levantar servicios con Docker Compose
    docker-compose -f docker-compose.microservices.yml up --build
}

# Ejecutar un servicio específico
dev_service() {
    local service=$1
    if [ -z "$service" ]; then
        error "Especifica el nombre del servicio"
        echo "Servicios disponibles: config-service, stock-integration-service, shipping-service, operator-interface-service"
        exit 1
    fi
    
    log "Iniciando $service en modo desarrollo..."
    
    # Verificar que el servicio existe
    if [ ! -d "services/$service" ]; then
        error "El servicio $service no existe"
        exit 1
    fi
    
    cd "services/$service"
    npm run start:dev
}

# Parar todos los servicios
stop() {
    log "Deteniendo todos los microservicios..."
    docker-compose -f docker-compose.microservices.yml down
    success "Todos los servicios detenidos"
}

# Limpiar containers y volúmenes
clean() {
    log "Limpiando containers, imágenes y volúmenes..."
    docker-compose -f docker-compose.microservices.yml down -v --rmi all
    success "Limpieza completada"
}

# Ver logs de todos los servicios
logs() {
    docker-compose -f docker-compose.microservices.yml logs -f
}

# Ver logs de un servicio específico
logs_service() {
    local service=$1
    if [ -z "$service" ]; then
        error "Especifica el nombre del servicio"
        echo "Servicios disponibles: config-service, stock-integration-service, shipping-service, operator-interface-service"
        exit 1
    fi
    
    docker-compose -f docker-compose.microservices.yml logs -f "$service"
}

# Ejecutar tests de todos los servicios
test() {
    log "Ejecutando tests de todos los microservicios..."
    
    services=("config-service" "stock-integration-service" "shipping-service" "operator-interface-service")
    
    for service in "${services[@]}"; do
        log "Ejecutando tests de $service..."
        cd "services/$service"
        npm test
        cd ../..
        success "Tests de $service completados"
    done
}

# Ver estado de los servicios
status() {
    log "Estado de los microservicios:"
    docker-compose -f docker-compose.microservices.yml ps
}

# Health check de todos los servicios
health() {
    log "Verificando health de todos los servicios..."
    
    services=(
        "http://localhost:3001/health:Shipping Service"
        "http://localhost:3002/health:Stock Integration Service"
        "http://localhost:3003/health:Config Service"
        "http://localhost:3004/health:Operator Interface Service"
    )
    
    for service_info in "${services[@]}"; do
        url="${service_info%%:*}"
        name="${service_info##*:}"
        
        if curl -f -s "$url" > /dev/null; then
            success "$name está funcionando"
        else
            error "$name no está respondiendo"
        fi
    done
}

# Mostrar ayuda
help() {
    echo "Script para manejar microservicios de logística"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  dev                     - Iniciar todos los servicios en modo desarrollo"
    echo "  dev-service <nombre>    - Iniciar un servicio específico"
    echo "  stop                    - Detener todos los servicios"
    echo "  clean                   - Limpiar containers y volúmenes"
    echo "  build                   - Compilar shared libraries y servicios"
    echo "  test                    - Ejecutar tests de todos los servicios"
    echo "  logs                    - Ver logs de todos los servicios"
    echo "  logs-service <nombre>   - Ver logs de un servicio específico"
    echo "  status                  - Ver estado de los servicios"
    echo "  health                  - Verificar health de todos los servicios"
    echo "  help                    - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 dev                  # Iniciar todos los servicios"
    echo "  $0 dev-service config-service  # Iniciar solo config-service"
    echo "  $0 logs-service shipping-service  # Ver logs del shipping-service"
}

# Procesar comando
case "$1" in
    "dev")
        dev
        ;;
    "dev-service")
        dev_service "$2"
        ;;
    "stop")
        stop
        ;;
    "clean")
        clean
        ;;
    "build")
        build_shared
        build_services
        ;;
    "test")
        test
        ;;
    "logs")
        logs
        ;;
    "logs-service")
        logs_service "$2"
        ;;
    "status")
        status
        ;;
    "health")
        health
        ;;
    "help"|"--help"|"-h"|"")
        help
        ;;
    *)
        error "Comando desconocido: $1"
        help
        exit 1
        ;;
esac