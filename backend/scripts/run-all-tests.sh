#!/bin/bash

# ===================================
# SCRIPT MAESTRO DE TESTING - MICROSERVICIOS
# TPI Desarrollo de Software 2025
# ===================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SCRIPT MAESTRO DE TESTING - MICROSERVICIOS${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}Arquitectura de Microservicios${NC}"
echo ""

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Cargar configuración de testing
if [ -f "$SCRIPT_DIR/testing-config.sh" ]; then
    source "$SCRIPT_DIR/testing-config.sh"
fi

echo -e "${YELLOW}📁 Directorio de scripts: $SCRIPT_DIR${NC}"
echo -e "${YELLOW}📁 Directorio backend: $BACKEND_DIR${NC}"
echo ""

# Configuración de microservicios
MICROSERVICES=(
    "config-service:3003"
    "stock-integration-service:3002"
    "shipping-service:3001"
    "operator-interface-service:3004"
)

# Función para verificar si un servicio está corriendo
check_service() {
    local service_name=$1
    local port=$2
    local url="http://localhost:$port/health"
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name (puerto $port) - ACTIVO${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name (puerto $port) - INACTIVO${NC}"
        return 1
    fi
}

# Función para ejecutar tests de un microservicio
test_microservice() {
    local service_name=$1
    local port=$2
    local service_dir="$BACKEND_DIR/services/$service_name"
    
    echo -e "${PURPLE}🧪 Testing $service_name...${NC}"
    echo -e "${PURPLE}================================${NC}"
    
    # Verificar que el directorio existe
    if [ ! -d "$service_dir" ]; then
        echo -e "${RED}❌ Directorio no encontrado: $service_dir${NC}"
        return 1
    fi
    
    # Verificar que el servicio está corriendo
    if ! check_service "$service_name" "$port"; then
        echo -e "${YELLOW}⚠️  Servicio $service_name no está corriendo. Iniciando...${NC}"
        cd "$service_dir"
        npm start &
        sleep 5
        
        if ! check_service "$service_name" "$port"; then
            echo -e "${RED}❌ No se pudo iniciar $service_name${NC}"
            return 1
        fi
    fi
    
    # Ejecutar tests del microservicio
    cd "$service_dir"
    if [ -f "package.json" ]; then
        echo -e "${BLUE}📦 Ejecutando tests para $service_name...${NC}"
        if npm test; then
            echo -e "${GREEN}✅ Tests de $service_name - COMPLETADOS${NC}"
        else
            echo -e "${RED}❌ Tests de $service_name - FALLARON${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  No se encontró package.json en $service_name${NC}"
    fi
    
    echo ""
}

# Función para mostrar menú interactivo
show_menu() {
    echo -e "${BLUE}📋 MENÚ DE TESTING - MICROSERVICIOS${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} Verificar estado de todos los servicios"
    echo -e "${YELLOW}2.${NC} Test individual de microservicio"
    echo -e "${YELLOW}3.${NC} Test de todos los microservicios"
    echo -e "${YELLOW}4.${NC} Test de APIs externas"
    echo -e "${YELLOW}5.${NC} Test de APIs internas"
    echo -e "${YELLOW}6.${NC} Test de APIs locales"
    echo -e "${YELLOW}7.${NC} Health check completo"
    echo -e "${YELLOW}8.${NC} Salir"
    echo ""
}

# Función para verificar estado de todos los servicios
check_all_services() {
    echo -e "${BLUE}🔍 VERIFICANDO ESTADO DE SERVICIOS${NC}"
    echo -e "${BLUE}===================================${NC}"
    echo ""
    
    local all_active=true
    
    for service_info in "${MICROSERVICES[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"
        if ! check_service "$service_name" "$port"; then
            all_active=false
        fi
    done
    
    echo ""
    if [ "$all_active" = true ]; then
        echo -e "${GREEN}🎉 TODOS LOS SERVICIOS ESTÁN ACTIVOS${NC}"
    else
        echo -e "${RED}⚠️  ALGUNOS SERVICIOS NO ESTÁN ACTIVOS${NC}"
        echo -e "${YELLOW}💡 Usa: ./microservices.sh dev para iniciar todos los servicios${NC}"
    fi
}

# Función para test individual
test_individual() {
    echo -e "${BLUE}🧪 TEST INDIVIDUAL DE MICROSERVICIO${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    
    echo -e "${YELLOW}Selecciona el microservicio a testear:${NC}"
    local i=1
    for service_info in "${MICROSERVICES[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"
        echo -e "${YELLOW}$i.${NC} $service_name (puerto $port)"
        ((i++))
    done
    
    echo ""
    read -p "Ingresa el número del servicio: " choice
    
    if [[ "$choice" =~ ^[1-4]$ ]]; then
        local selected_service="${MICROSERVICES[$((choice-1))]}"
        IFS=':' read -r service_name port <<< "$selected_service"
        test_microservice "$service_name" "$port"
    else
        echo -e "${RED}❌ Opción inválida${NC}"
    fi
}

# Función para test de todos los microservicios
test_all_microservices() {
    echo -e "${BLUE}🧪 TESTING TODOS LOS MICROSERVICIOS${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    
    local failed_services=()
    
    for service_info in "${MICROSERVICES[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"
        if ! test_microservice "$service_name" "$port"; then
            failed_services+=("$service_name")
        fi
    done
    
    echo -e "${BLUE}📊 RESUMEN DE TESTS${NC}"
    echo -e "${BLUE}===================${NC}"
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        echo -e "${GREEN}🎉 TODOS LOS TESTS PASARON${NC}"
    else
        echo -e "${RED}❌ TESTS FALLARON EN: ${failed_services[*]}${NC}"
    fi
}

# Función para health check completo
health_check() {
    echo -e "${BLUE}🏥 HEALTH CHECK COMPLETO${NC}"
    echo -e "${BLUE}=========================${NC}"
    echo ""
    
    for service_info in "${MICROSERVICES[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"
        echo -e "${YELLOW}🔍 Verificando $service_name...${NC}"
        
        if check_service "$service_name" "$port"; then
            # Obtener información detallada del health check
            local health_url="http://localhost:$port/health"
            local health_response=$(curl -s "$health_url" 2>/dev/null || echo "{}")
            echo -e "${GREEN}✅ $service_name - Salud OK${NC}"
            echo -e "${BLUE}   Response: $health_response${NC}"
        else
            echo -e "${RED}❌ $service_name - No responde${NC}"
        fi
        echo ""
    done
}

# Función principal
main() {
    while true; do
        show_menu
        read -p "Selecciona una opción (1-8): " choice
        
        case $choice in
            1)
                check_all_services
                ;;
            2)
                test_individual
                ;;
            3)
                test_all_microservices
                ;;
            4)
                echo -e "${BLUE}🌐 Ejecutando tests de APIs externas...${NC}"
                if [ -f "$SCRIPT_DIR/test-api-external.sh" ]; then
                    bash "$SCRIPT_DIR/test-api-external.sh"
                else
                    echo -e "${RED}❌ Script test-api-external.sh no encontrado${NC}"
                fi
                ;;
            5)
                echo -e "${BLUE}🏗️  Ejecutando tests de APIs internas...${NC}"
                if [ -f "$SCRIPT_DIR/test-api-internal.sh" ]; then
                    bash "$SCRIPT_DIR/test-api-internal.sh"
                else
                    echo -e "${RED}❌ Script test-api-internal.sh no encontrado${NC}"
                fi
                ;;
            6)
                echo -e "${BLUE}🏠 Ejecutando tests de APIs locales...${NC}"
                if [ -f "$SCRIPT_DIR/test-api-local.sh" ]; then
                    bash "$SCRIPT_DIR/test-api-local.sh"
                else
                    echo -e "${RED}❌ Script test-api-local.sh no encontrado${NC}"
                fi
                ;;
            7)
                health_check
                ;;
            8)
                echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Opción inválida. Intenta de nuevo.${NC}"
                ;;
        esac
        
        echo ""
        read -p "Presiona Enter para continuar..."
        echo ""
    done
}

# Ejecutar función principal
main