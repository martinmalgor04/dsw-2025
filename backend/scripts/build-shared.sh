#!/usr/bin/env bash

# ===================================
# SCRIPT DE BUILD DE LIBRERÍAS COMPARTIDAS
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
    echo "🔨 Script de Build de Librerías Compartidas"
    echo "============================================="
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  build                    - Construir todas las librerías compartidas"
    echo "  build-database           - Construir solo database"
    echo "  build-types             - Construir solo types"
    echo "  build-utils             - Construir solo utils"
    echo "  clean                    - Limpiar builds anteriores"
    echo "  install                  - Instalar dependencias"
    echo "  test                     - Ejecutar tests"
    echo "  validate                 - Validar configuración"
    echo "  status                   - Mostrar estado de builds"
    echo "  help                     - Mostrar esta ayuda"
    echo ""
    echo "Opciones:"
    echo "  --parallel               - Ejecutar builds en paralelo"
    echo "  --verbose                - Mostrar output detallado"
    echo "  --force                  - Forzar rebuild aunque no haya cambios"
    echo "  --watch                  - Modo watch para desarrollo"
    echo ""
    echo "Ejemplos:"
    echo "  $0 build                 # Construir todas las librerías"
    echo "  $0 build --parallel      # Construir en paralelo"
    echo "  $0 build-database        # Construir solo database"
    echo "  $0 clean                 # Limpiar builds"
    echo "  $0 install               # Instalar dependencias"
    echo ""
}

# Función para validar configuración
validate_config() {
    log "Validando configuración..."
    
    local errors=0
    
    # Validar que el directorio backend existe
    if [ ! -d "$BACKEND_DIR" ]; then
        error "Directorio backend no encontrado: $BACKEND_DIR"
        ((errors++))
    fi
    
    # Validar que las librerías compartidas existen
    local shared_libs=("database" "types" "utils")
    for lib in "${shared_libs[@]}"; do
        if [ ! -d "$BACKEND_DIR/shared/$lib" ]; then
            error "Librería compartida no encontrada: $BACKEND_DIR/shared/$lib"
            ((errors++))
        fi
        
        if [ ! -f "$BACKEND_DIR/shared/$lib/package.json" ]; then
            error "package.json no encontrado en: $BACKEND_DIR/shared/$lib"
            ((errors++))
        fi
    done
    
    # Validar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado"
        ((errors++))
    fi
    
    # Validar npm
    if ! command -v npm &> /dev/null; then
        error "npm no está instalado"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        success "Configuración válida"
        return 0
    else
        error "Configuración inválida ($errors errores)"
        return 1
    fi
}

# Función para instalar dependencias
install_dependencies() {
    log "Instalando dependencias de librerías compartidas..."
    
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
    
    if [ $failed -eq 0 ]; then
        success "Todas las dependencias instaladas"
        return 0
    else
        error "Error instalando dependencias ($failed fallos)"
        return 1
    fi
}

# Función para limpiar builds
clean_builds() {
    log "Limpiando builds anteriores..."
    
    local shared_libs=("database" "types" "utils")
    local cleaned=0
    
    for lib in "${shared_libs[@]}"; do
        log "Limpiando $lib..."
        cd "$BACKEND_DIR/shared/$lib"
        
        # Limpiar dist
        if [ -d "dist" ]; then
            rm -rf dist
            success "Dist de $lib limpiado"
            ((cleaned++))
        fi
        
        # Limpiar node_modules (opcional)
        if [ "${CLEAN_NODE_MODULES:-false}" = "true" ]; then
            if [ -d "node_modules" ]; then
                rm -rf node_modules
                success "node_modules de $lib limpiado"
            fi
        fi
        
        # Limpiar package-lock.json (opcional)
        if [ "${CLEAN_PACKAGE_LOCK:-false}" = "true" ]; then
            if [ -f "package-lock.json" ]; then
                rm -f package-lock.json
                success "package-lock.json de $lib limpiado"
            fi
        fi
    done
    
    success "Limpieza completada ($cleaned librerías)"
}

# Función para construir una librería específica
build_library() {
    local lib_name="$1"
    local lib_path="$BACKEND_DIR/shared/$lib_name"
    
    log "Construyendo $lib_name..."
    
    if [ ! -d "$lib_path" ]; then
        error "Librería $lib_name no encontrada en $lib_path"
        return 1
    fi
    
    cd "$lib_path"
    
    # Verificar si hay cambios (si no se fuerza)
    if [ "${FORCE_BUILD:-false}" = "false" ] && [ -d "dist" ]; then
        if [ "dist" -nt "package.json" ] && [ "dist" -nt "src" ]; then
            info "$lib_name ya está actualizado, saltando..."
            return 0
        fi
    fi
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        log "Instalando dependencias de $lib_name..."
        if ! npm install; then
            error "Error instalando dependencias de $lib_name"
            return 1
        fi
    fi
    
    # Construir
    if npm run build; then
        success "$lib_name construido correctamente"
        return 0
    else
        error "Error construyendo $lib_name"
        return 1
    fi
}

# Función para construir todas las librerías
build_all() {
    log "Construyendo todas las librerías compartidas..."
    
    local shared_libs=("database" "types" "utils")
    local failed=0
    local built=0
    
    # Determinar si ejecutar en paralelo
    if [ "${PARALLEL_BUILD:-false}" = "true" ]; then
        log "Ejecutando builds en paralelo..."
        
        # Ejecutar builds en paralelo
        for lib in "${shared_libs[@]}"; do
            build_library "$lib" &
        done
        
        # Esperar a que terminen todos
        wait
        
        # Verificar resultados
        for lib in "${shared_libs[@]}"; do
            if [ -d "$BACKEND_DIR/shared/$lib/dist" ]; then
                success "$lib construido"
                ((built++))
            else
                error "$lib falló"
                ((failed++))
            fi
        done
    else
        # Ejecutar builds secuencialmente
        for lib in "${shared_libs[@]}"; do
            if build_library "$lib"; then
                ((built++))
            else
                ((failed++))
            fi
        done
    fi
    
    # Resumen
    log "Resumen de builds:"
    echo "  ✅ Exitosos: $built"
    echo "  ❌ Fallidos: $failed"
    
    if [ $failed -eq 0 ]; then
        success "Todas las librerías construidas correctamente"
        return 0
    else
        error "Algunas librerías fallaron ($failed fallos)"
        return 1
    fi
}

# Función para ejecutar tests
run_tests() {
    log "Ejecutando tests de librerías compartidas..."
    
    local shared_libs=("database" "types" "utils")
    local passed=0
    local failed=0
    
    for lib in "${shared_libs[@]}"; do
        log "Ejecutando tests de $lib..."
        cd "$BACKEND_DIR/shared/$lib"
        
        if npm test; then
            success "Tests de $lib pasaron"
            ((passed++))
        else
            error "Tests de $lib fallaron"
            ((failed++))
        fi
    done
    
    # Resumen
    log "Resumen de tests:"
    echo "  ✅ Exitosos: $passed"
    echo "  ❌ Fallidos: $failed"
    
    if [ $failed -eq 0 ]; then
        success "Todos los tests pasaron"
        return 0
    else
        error "Algunos tests fallaron ($failed fallos)"
        return 1
    fi
}

# Función para mostrar estado
show_status() {
    log "Estado de librerías compartidas:"
    echo ""
    
    local shared_libs=("database" "types" "utils")
    
    for lib in "${shared_libs[@]}"; do
        local lib_path="$BACKEND_DIR/shared/$lib"
        local dist_path="$lib_path/dist"
        
        echo -e "${CYAN}📦 $lib${NC}"
        echo "  📁 Ruta: $lib_path"
        
        if [ -d "$dist_path" ]; then
            local build_time=$(stat -f "%Sm" "$dist_path" 2>/dev/null || stat -c "%y" "$dist_path" 2>/dev/null || echo "desconocido")
            echo "  ✅ Construido: $build_time"
            
            # Mostrar tamaño
            local size=$(du -sh "$dist_path" 2>/dev/null | cut -f1 || echo "desconocido")
            echo "  📊 Tamaño: $size"
        else
            echo "  ❌ No construido"
        fi
        
        # Mostrar dependencias
        if [ -f "$lib_path/package.json" ]; then
            local deps=$(grep -c '"dependencies"' "$lib_path/package.json" 2>/dev/null || echo "0")
            echo "  📦 Dependencias: $deps"
        fi
        
        echo ""
    done
}

# Función para modo watch
watch_mode() {
    log "Iniciando modo watch para desarrollo..."
    
    # Verificar que fswatch esté instalado
    if ! command -v fswatch &> /dev/null; then
        error "fswatch no está instalado. Instálalo con: brew install fswatch (macOS) o apt-get install fswatch (Ubuntu)"
        return 1
    fi
    
    # Construir inicialmente
    build_all
    
    # Configurar watch
    local watch_dirs=()
    for lib in "database" "types" "utils"; do
        watch_dirs+=("$BACKEND_DIR/shared/$lib/src")
    done
    
    log "Observando cambios en: ${watch_dirs[*]}"
    
    # Ejecutar watch
    fswatch -o "${watch_dirs[@]}" | while read; do
        log "Cambios detectados, reconstruyendo..."
        build_all
    done
}

# Función principal
main() {
    local command="${1:-help}"
    shift || true
    
    # Procesar opciones
    while [[ $# -gt 0 ]]; do
        case $1 in
            --parallel)
                PARALLEL_BUILD=true
                shift
                ;;
            --verbose)
                set -x
                shift
                ;;
            --force)
                FORCE_BUILD=true
                shift
                ;;
            --watch)
                WATCH_MODE=true
                shift
                ;;
            --clean-node-modules)
                CLEAN_NODE_MODULES=true
                shift
                ;;
            --clean-package-lock)
                CLEAN_PACKAGE_LOCK=true
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
        "build")
            validate_config && build_all
            ;;
        "build-database")
            validate_config && build_library "database"
            ;;
        "build-types")
            validate_config && build_library "types"
            ;;
        "build-utils")
            validate_config && build_library "utils"
            ;;
        "clean")
            clean_builds
            ;;
        "install")
            validate_config && install_dependencies
            ;;
        "test")
            validate_config && run_tests
            ;;
        "validate")
            validate_config
            ;;
        "status")
            show_status
            ;;
        "watch")
            validate_config && watch_mode
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
