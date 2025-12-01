#!/usr/bin/env bash

# ===================================
# SCRIPT DE SETUP INICIAL
# TPI Desarrollo de Software 2025
# ===================================

set -euo pipefail

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"

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
    echo "🚀 Script de Setup Inicial"
    echo "=========================="
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  init                     - Configuración inicial completa"
    echo "  env                      - Configurar archivo .env"
    echo "  deps                     - Instalar dependencias"
    echo "  build                    - Construir librerías compartidas"
    echo "  test                     - Ejecutar tests iniciales"
    echo "  validate                 - Validar configuración"
    echo "  clean                    - Limpiar instalación"
    echo "  help                     - Mostrar esta ayuda"
    echo ""
    echo "Opciones:"
    echo "  --force                  - Forzar setup aunque ya esté configurado"
    echo "  --skip-deps              - Saltar instalación de dependencias"
    echo "  --skip-build              - Saltar construcción de librerías"
    echo "  --skip-test               - Saltar tests iniciales"
    echo "  --env-file <archivo>      - Usar archivo .env específico"
    echo ""
    echo "Ejemplos:"
    echo "  $0 init                  # Setup completo"
    echo "  $0 init --force          # Setup forzado"
    echo "  $0 env                   # Solo configurar .env"
    echo "  $0 deps                  # Solo instalar dependencias"
    echo ""
}

# Función para verificar prerrequisitos
check_prerequisites() {
    log "Verificando prerrequisitos..."
    
    local errors=0
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado"
        echo "  Instala Node.js desde: https://nodejs.org/"
        ((errors++))
    else
        local node_version=$(node --version)
        info "Node.js encontrado: $node_version"
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        error "npm no está instalado"
        ((errors++))
    else
        local npm_version=$(npm --version)
        info "npm encontrado: $npm_version"
    fi
    
    # Verificar Docker (opcional)
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version)
        info "Docker encontrado: $docker_version"
    else
        warning "Docker no encontrado (opcional para desarrollo local)"
    fi
    
    # Verificar Docker Compose (opcional)
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version)
        info "Docker Compose encontrado: $compose_version"
    else
        warning "Docker Compose no encontrado (opcional para desarrollo local)"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        error "Git no está instalado"
        ((errors++))
    else
        local git_version=$(git --version)
        info "Git encontrado: $git_version"
    fi
    
    if [ $errors -eq 0 ]; then
        success "Prerrequisitos verificados"
        return 0
    else
        error "Prerrequisitos faltantes ($errors errores)"
        return 1
    fi
}

# Función para configurar archivo .env
setup_env() {
    local env_file="${1:-$SCRIPT_DIR/.env}"
    
    log "Configurando archivo .env..."
    
    if [ -f "$env_file" ] && [ "${FORCE_SETUP:-false}" = "false" ]; then
        warning "Archivo .env ya existe: $env_file"
        info "Usa --force para sobrescribir"
        return 0
    fi
    
    # Copiar desde ejemplo
    if [ -f "$SCRIPT_DIR/env.example" ]; then
        cp "$SCRIPT_DIR/env.example" "$env_file"
        success "Archivo .env creado desde ejemplo"
    else
        error "Archivo env.example no encontrado"
        return 1
    fi
    
    # Mostrar configuración
    info "Configuración actual:"
    echo "  📁 Archivo: $env_file"
    echo "  🔧 Entorno: ${ENVIRONMENT:-development}"
    echo "  🌐 URLs: Configuradas para desarrollo local"
    
    success "Archivo .env configurado"
}

# Función para instalar dependencias
install_dependencies() {
    log "Instalando dependencias..."
    
    # Instalar dependencias de librerías compartidas
    local shared_libs=("database" "types" "utils")
    local failed=0
    
    for lib in "${shared_libs[@]}"; do
        log "Instalando dependencias de $lib..."
        cd "$BACKEND_DIR/shared/$lib"
        
        if npm install; then
            success "Dependencias de $lib instaladas"
        else
            error "Error instalando dependencias de $lib"
            ((failed++))
        fi
    done
    
    # Instalar dependencias de microservicios
    local services=("config-service" "stock-integration-service" "shipping-service" "operator-interface-service")
    
    for service in "${services[@]}"; do
        if [ -d "$BACKEND_DIR/services/$service" ]; then
            log "Instalando dependencias de $service..."
            cd "$BACKEND_DIR/services/$service"
            
            if npm install; then
                success "Dependencias de $service instaladas"
            else
                error "Error instalando dependencias de $service"
                ((failed++))
            fi
        else
            warning "Servicio $service no encontrado, saltando..."
        fi
    done
    
    if [ $failed -eq 0 ]; then
        success "Todas las dependencias instaladas"
        return 0
    else
        error "Error instalando dependencias ($failed fallos)"
        return 1
    fi
}

# Función para construir librerías compartidas
build_shared_libraries() {
    log "Construyendo librerías compartidas..."
    
    if [ -f "$SCRIPT_DIR/build-shared.sh" ]; then
        if "$SCRIPT_DIR/build-shared.sh" build; then
            success "Librerías compartidas construidas"
            return 0
        else
            error "Error construyendo librerías compartidas"
            return 1
        fi
    else
        error "Script build-shared.sh no encontrado"
        return 1
    fi
}

# Función para ejecutar tests iniciales
run_initial_tests() {
    log "Ejecutando tests iniciales..."
    
    # Tests de librerías compartidas
    if [ -f "$SCRIPT_DIR/build-shared.sh" ]; then
        log "Ejecutando tests de librerías compartidas..."
        if "$SCRIPT_DIR/build-shared.sh" test; then
            success "Tests de librerías compartidas pasaron"
        else
            warning "Algunos tests de librerías compartidas fallaron"
        fi
    fi
    
    # Tests de microservicios (si están disponibles)
    if [ -f "$SCRIPT_DIR/test-api-local.sh" ]; then
        log "Ejecutando tests de microservicios..."
        if "$SCRIPT_DIR/test-api-local.sh"; then
            success "Tests de microservicios pasaron"
        else
            warning "Algunos tests de microservicios fallaron"
        fi
    fi
    
    success "Tests iniciales completados"
}

# Función para validar configuración
validate_setup() {
    log "Validando configuración..."
    
    local errors=0
    
    # Verificar archivo .env
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        error "Archivo .env no encontrado"
        ((errors++))
    fi
    
    # Verificar librerías compartidas
    local shared_libs=("database" "types" "utils")
    for lib in "${shared_libs[@]}"; do
        if [ ! -d "$BACKEND_DIR/shared/$lib" ]; then
            error "Librería compartida no encontrada: $lib"
            ((errors++))
        fi
        
        if [ ! -d "$BACKEND_DIR/shared/$lib/node_modules" ]; then
            error "Dependencias no instaladas en: $lib"
            ((errors++))
        fi
        
        if [ ! -d "$BACKEND_DIR/shared/$lib/dist" ]; then
            error "Librería no construida: $lib"
            ((errors++))
        fi
    done
    
    # Verificar microservicios
    local services=("config-service" "stock-integration-service" "shipping-service" "operator-interface-service")
    for service in "${services[@]}"; do
        if [ -d "$BACKEND_DIR/services/$service" ]; then
            if [ ! -d "$BACKEND_DIR/services/$service/node_modules" ]; then
                error "Dependencias no instaladas en: $service"
                ((errors++))
            fi
        fi
    done
    
    if [ $errors -eq 0 ]; then
        success "Configuración válida"
        return 0
    else
        error "Configuración inválida ($errors errores)"
        return 1
    fi
}

# Función para limpiar instalación
clean_setup() {
    log "Limpiando instalación..."
    
    # Limpiar node_modules
    find "$BACKEND_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Limpiar dist
    find "$BACKEND_DIR" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Limpiar package-lock.json
    find "$BACKEND_DIR" -name "package-lock.json" -type f -delete 2>/dev/null || true
    
    success "Instalación limpiada"
}

# Función para setup completo
full_setup() {
    log "Iniciando setup completo..."
    
    # 1. Verificar prerrequisitos
    if ! check_prerequisites; then
        error "Prerrequisitos no cumplidos"
        return 1
    fi
    
    # 2. Configurar .env
    if ! setup_env; then
        error "Error configurando .env"
        return 1
    fi
    
    # 3. Instalar dependencias (si no se salta)
    if [ "${SKIP_DEPS:-false}" = "false" ]; then
        if ! install_dependencies; then
            error "Error instalando dependencias"
            return 1
        fi
    else
        info "Saltando instalación de dependencias"
    fi
    
    # 4. Construir librerías compartidas (si no se salta)
    if [ "${SKIP_BUILD:-false}" = "false" ]; then
        if ! build_shared_libraries; then
            error "Error construyendo librerías compartidas"
            return 1
        fi
    else
        info "Saltando construcción de librerías"
    fi
    
    # 5. Ejecutar tests iniciales (si no se salta)
    if [ "${SKIP_TEST:-false}" = "false" ]; then
        if ! run_initial_tests; then
            warning "Algunos tests fallaron, pero el setup continúa"
        fi
    else
        info "Saltando tests iniciales"
    fi
    
    # 6. Validar configuración
    if ! validate_setup; then
        error "Configuración inválida después del setup"
        return 1
    fi
    
    success "Setup completo finalizado"
    
    # Mostrar próximos pasos
    echo ""
    echo -e "${CYAN}🎉 ¡Setup completado exitosamente!${NC}"
    echo ""
    echo -e "${YELLOW}Próximos pasos:${NC}"
    echo "  1. Revisar configuración en scripts/.env"
    echo "  2. Iniciar microservicios: ./scripts/microservices.sh dev"
    echo "  3. Ejecutar tests: ./scripts/test-api-local.sh"
    echo "  4. Ver documentación: scripts/README.md"
    echo ""
}

# Función principal
main() {
    local command="${1:-help}"
    shift || true
    
    # Procesar opciones
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_SETUP=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-test)
                SKIP_TEST=true
                shift
                ;;
            --env-file)
                ENV_FILE="$2"
                shift 2
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
        "init")
            full_setup
            ;;
        "env")
            setup_env "$ENV_FILE"
            ;;
        "deps")
            check_prerequisites && install_dependencies
            ;;
        "build")
            build_shared_libraries
            ;;
        "test")
            run_initial_tests
            ;;
        "validate")
            validate_setup
            ;;
        "clean")
            clean_setup
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
