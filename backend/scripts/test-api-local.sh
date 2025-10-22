#!/bin/bash

# ===================================
# SCRIPT DE TESTING API LOCAL - MICROSERVICIOS
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

echo -e "${BLUE}🧪 TESTING API LOCAL - MICROSERVICIOS${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Configuración de microservicios
declare -A SERVICES=(
    ["config-service"]="http://localhost:3003"
    ["stock-integration-service"]="http://localhost:3002"
    ["shipping-service"]="http://localhost:3001"
    ["operator-interface-service"]="http://localhost:3004"
)

# Contadores
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Función para imprimir resultados
print_result() {
    local test_name="$1"
    local status="$2"
    local response="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        echo -e "${RED}Response: $response${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Función para hacer requests
make_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    local expected_status="$4"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "PASS"
    else
        echo "FAIL - HTTP $http_code: $body"
    fi
}

# Función para verificar si un servicio está activo
check_service() {
    local service_name="$1"
    local base_url="$2"
    
    echo -e "${YELLOW}🔍 Verificando $service_name en $base_url...${NC}"
    
    if curl -s -f "$base_url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name está activo${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name no está activo${NC}"
        return 1
    fi
}

# Función para testear un microservicio
test_microservice() {
    local service_name="$1"
    local base_url="$2"
    
    echo -e "${PURPLE}🧪 TESTING $service_name${NC}"
    echo -e "${PURPLE}========================${NC}"
    
    # Verificar que el servicio está activo
    if ! check_service "$service_name" "$base_url"; then
        echo -e "${YELLOW}⚠️  Saltando tests de $service_name (no está activo)${NC}"
        return 1
    fi
    
    # Tests específicos por servicio
    case $service_name in
        "config-service")
            test_config_service "$base_url"
            ;;
        "stock-integration-service")
            test_stock_integration_service "$base_url"
            ;;
        "shipping-service")
            test_shipping_service "$base_url"
            ;;
        "operator-interface-service")
            test_operator_interface_service "$base_url"
            ;;
    esac
    
    echo ""
}

# Tests para Config Service
test_config_service() {
    local base_url="$1"
    
    echo -e "${BLUE}🏗️  Testing Config Service${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Config Service Health Check" "$result" ""
    
    # Transport methods
    result=$(make_request "GET" "$base_url/transport-methods" "" "200")
    print_result "Get Transport Methods" "$result" ""
    
    # Coverage zones
    result=$(make_request "GET" "$base_url/coverage-zones" "" "200")
    print_result "Get Coverage Zones" "$result" ""
    
    # Create transport method
    transport_data='{
        "code": "TEST_ROAD",
        "name": "Test Road Transport",
        "description": "Test road transport method",
        "averageSpeed": 80,
        "estimatedDays": "3-5",
        "baseCostPerKm": 0.5,
        "baseCostPerKg": 1.0
    }'
    
    result=$(make_request "POST" "$base_url/transport-methods" "$transport_data" "201")
    print_result "Create Transport Method" "$result" ""
    
    # Create coverage zone
    coverage_data='{
        "name": "Test Zone",
        "description": "Test coverage zone",
        "postalCodes": ["C1000AAA", "C1000AAB"]
    }'
    
    result=$(make_request "POST" "$base_url/coverage-zones" "$coverage_data" "201")
    print_result "Create Coverage Zone" "$result" ""
}

# Tests para Stock Integration Service
test_stock_integration_service() {
    local base_url="$1"
    
    echo -e "${BLUE}📦 Testing Stock Integration Service${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Stock Integration Health Check" "$result" ""
    
    # Get product by ID (mock)
    result=$(make_request "GET" "$base_url/products/1" "" "200")
    print_result "Get Product by ID" "$result" ""
    
    # Get reservations by user ID (mock)
    result=$(make_request "GET" "$base_url/reservations?userId=1" "" "200")
    print_result "Get Reservations by User ID" "$result" ""
}

# Tests para Shipping Service
test_shipping_service() {
    local base_url="$1"
    
    echo -e "${BLUE}🚚 Testing Shipping Service${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Shipping Service Health Check" "$result" ""
    
    # Calculate shipping cost
    cost_data='{
        "products": [
            {
                "id": 1,
                "quantity": 2
            }
        ],
        "delivery_address": {
            "street": "Av. San Martín 1234",
            "city": "Rosario",
            "state": "Santa Fe",
            "postal_code": "S2000ABC",
            "country": "AR"
        }
    }'
    
    result=$(make_request "POST" "$base_url/shipping/cost" "$cost_data" "200")
    print_result "Calculate Shipping Cost" "$result" ""
    
    # Create shipping
    shipping_data='{
        "products": [
            {
                "id": 1,
                "quantity": 2
            }
        ],
        "delivery_address": {
            "street": "San Martín 1234",
            "city": "Rosario",
            "state": "Santa Fe",
            "postal_code": "S2000ABC",
            "country": "AR"
        },
        "transport_type": "road",
        "user_id": 1,
        "order_id": 1
    }'
    
    result=$(make_request "POST" "$base_url/shipping" "$shipping_data" "201")
    print_result "Create Shipping" "$result" ""
}

# Tests para Operator Interface Service
test_operator_interface_service() {
    local base_url="$1"
    
    echo -e "${BLUE}👨‍💼 Testing Operator Interface Service${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Operator Interface Health Check" "$result" ""
    
    # Get service info
    result=$(make_request "GET" "$base_url/" "" "200")
    print_result "Get Service Info" "$result" ""
    
    # Get all shippings
    result=$(make_request "GET" "$base_url/shippings" "" "200")
    print_result "Get All Shippings" "$result" ""
    
    # Get shipping by ID
    result=$(make_request "GET" "$base_url/shippings/1" "" "200")
    print_result "Get Shipping by ID" "$result" ""
}

# Función principal
main() {
    echo -e "${BLUE}🚀 INICIANDO TESTING DE MICROSERVICIOS${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo ""
    
    # Testear cada microservicio
    for service_name in "${!SERVICES[@]}"; do
        test_microservice "$service_name" "${SERVICES[$service_name]}"
    done
    
    # Resumen final
    echo -e "${BLUE}📊 RESUMEN DE TESTING${NC}"
    echo -e "${BLUE}=====================${NC}"
    echo -e "${BLUE}Total de tests: ${TESTS_TOTAL}${NC}"
    echo -e "${GREEN}Tests exitosos: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Tests fallidos: ${TESTS_FAILED}${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 ¡TODOS LOS TESTS PASARON!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  ALGUNOS TESTS FALLARON${NC}"
        echo -e "${YELLOW}Revisa los logs arriba para más detalles${NC}"
        exit 1
    fi
}

# Ejecutar función principal
main