#!/bin/bash

# ===================================
# SCRIPT DE TESTING API INTERNA - MICROSERVICIOS
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

echo -e "${BLUE}🏗️  TESTING API INTERNA - MICROSERVICIOS${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Configuración de microservicios internos
declare -A INTERNAL_SERVICES=(
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

# Tests para Config Service (endpoints internos)
test_config_internal() {
    local base_url="$1"
    
    echo -e "${BLUE}🏗️  Testing Config Service - Endpoints Internos${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Config Service Health Check" "$result" ""
    
    # Transport methods CRUD
    result=$(make_request "GET" "$base_url/transport-methods" "" "200")
    print_result "Get All Transport Methods" "$result" ""
    
    # Create transport method
    transport_data='{
        "code": "TEST_INTERNAL_ROAD",
        "name": "Test Internal Road Transport",
        "description": "Test internal road transport method",
        "averageSpeed": 80,
        "estimatedDays": "3-5",
        "baseCostPerKm": 0.5,
        "baseCostPerKg": 1.0
    }'
    
    result=$(make_request "POST" "$base_url/transport-methods" "$transport_data" "201")
    print_result "Create Transport Method (Internal)" "$result" ""
    
    # Get transport method by ID
    result=$(make_request "GET" "$base_url/transport-methods/1" "" "200")
    print_result "Get Transport Method by ID" "$result" ""
    
    # Update transport method
    update_data='{
        "name": "Updated Test Internal Road Transport",
        "description": "Updated test internal road transport method"
    }'
    
    result=$(make_request "PATCH" "$base_url/transport-methods/1" "$update_data" "200")
    print_result "Update Transport Method (Internal)" "$result" ""
    
    # Coverage zones CRUD
    result=$(make_request "GET" "$base_url/coverage-zones" "" "200")
    print_result "Get All Coverage Zones" "$result" ""
    
    # Create coverage zone
    coverage_data='{
        "name": "Test Internal Zone",
        "description": "Test internal coverage zone",
        "postalCodes": ["C1000AAA", "C1000AAB", "C1000AAC"]
    }'
    
    result=$(make_request "POST" "$base_url/coverage-zones" "$coverage_data" "201")
    print_result "Create Coverage Zone (Internal)" "$result" ""
    
    # Get coverage zone by ID
    result=$(make_request "GET" "$base_url/coverage-zones/1" "" "200")
    print_result "Get Coverage Zone by ID" "$result" ""
    
    # Update coverage zone
    update_coverage_data='{
        "name": "Updated Test Internal Zone",
        "description": "Updated test internal coverage zone"
    }'
    
    result=$(make_request "PATCH" "$base_url/coverage-zones/1" "$update_coverage_data" "200")
    print_result "Update Coverage Zone (Internal)" "$result" ""
}

# Tests para Stock Integration Service (endpoints internos)
test_stock_integration_internal() {
    local base_url="$1"
    
    echo -e "${BLUE}📦 Testing Stock Integration Service - Endpoints Internos${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Stock Integration Health Check" "$result" ""
    
    # Get product by ID (internal endpoint)
    result=$(make_request "GET" "$base_url/products/1" "" "200")
    print_result "Get Product by ID (Internal)" "$result" ""
    
    # Get reservations by user ID (internal endpoint)
    result=$(make_request "GET" "$base_url/reservations?userId=1" "" "200")
    print_result "Get Reservations by User ID (Internal)" "$result" ""
    
    # Get reservation by ID (internal endpoint)
    result=$(make_request "GET" "$base_url/reservations/1" "" "200")
    print_result "Get Reservation by ID (Internal)" "$result" ""
    
    # Update reservation status (internal endpoint)
    update_reservation_data='{
        "status": "confirmed",
        "updatedBy": "system"
    }'
    
    result=$(make_request "PATCH" "$base_url/reservations/1" "$update_reservation_data" "200")
    print_result "Update Reservation Status (Internal)" "$result" ""
}

# Tests para Shipping Service (endpoints internos)
test_shipping_internal() {
    local base_url="$1"
    
    echo -e "${BLUE}🚚 Testing Shipping Service - Endpoints Internos${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Shipping Service Health Check" "$result" ""
    
    # Calculate shipping cost (internal endpoint)
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
    print_result "Calculate Shipping Cost (Internal)" "$result" ""
    
    # Create shipping (internal endpoint)
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
    print_result "Create Shipping (Internal)" "$result" ""
    
    # Get all shippings (internal endpoint)
    result=$(make_request "GET" "$base_url/shipping" "" "200")
    print_result "Get All Shippings (Internal)" "$result" ""
    
    # Get shipping by ID (internal endpoint)
    result=$(make_request "GET" "$base_url/shipping/1" "" "200")
    print_result "Get Shipping by ID (Internal)" "$result" ""
    
    # Update shipping status (internal endpoint)
    update_shipping_data='{
        "status": "in_transit",
        "updated_by": "operator"
    }'
    
    result=$(make_request "PATCH" "$base_url/shipping/1" "$update_shipping_data" "200")
    print_result "Update Shipping Status (Internal)" "$result" ""
}

# Tests para Operator Interface Service (endpoints internos)
test_operator_interface_internal() {
    local base_url="$1"
    
    echo -e "${BLUE}👨‍💼 Testing Operator Interface Service - Endpoints Internos${NC}"
    
    # Health check
    result=$(make_request "GET" "$base_url/health" "" "200")
    print_result "Operator Interface Health Check" "$result" ""
    
    # Get service info (internal endpoint)
    result=$(make_request "GET" "$base_url/" "" "200")
    print_result "Get Service Info (Internal)" "$result" ""
    
    # Get all shippings (internal endpoint)
    result=$(make_request "GET" "$base_url/shippings" "" "200")
    print_result "Get All Shippings (Internal)" "$result" ""
    
    # Get shipping by ID (internal endpoint)
    result=$(make_request "GET" "$base_url/shippings/1" "" "200")
    print_result "Get Shipping by ID (Internal)" "$result" ""
    
    # Get shipping by status (internal endpoint)
    result=$(make_request "GET" "$base_url/shippings?status=pending" "" "200")
    print_result "Get Shippings by Status (Internal)" "$result" ""
    
    # Get shipping by user ID (internal endpoint)
    result=$(make_request "GET" "$base_url/shippings?userId=1" "" "200")
    print_result "Get Shippings by User ID (Internal)" "$result" ""
}

# Tests de casos de error para endpoints internos
test_internal_error_cases() {
    echo -e "${BLUE}🚨 TESTING CASOS DE ERROR - ENDPOINTS INTERNOS${NC}"
    echo -e "${BLUE}===============================================${NC}"
    
    # Test con Config Service
    local config_url="${INTERNAL_SERVICES[config-service]}"
    
    # Transport method no encontrado
    result=$(make_request "GET" "$config_url/transport-methods/999" "" "404")
    print_result "Error - Transport Method Not Found" "$result" ""
    
    # Coverage zone no encontrada
    result=$(make_request "GET" "$config_url/coverage-zones/999" "" "404")
    print_result "Error - Coverage Zone Not Found" "$result" ""
    
    # Datos inválidos para transport method
    invalid_transport_data='{
        "code": "",
        "name": "",
        "averageSpeed": -1
    }'
    
    result=$(make_request "POST" "$config_url/transport-methods" "$invalid_transport_data" "422")
    print_result "Error - Invalid Transport Method Data" "$result" ""
    
    # Datos inválidos para coverage zone
    invalid_coverage_data='{
        "name": "",
        "postalCodes": []
    }'
    
    result=$(make_request "POST" "$config_url/coverage-zones" "$invalid_coverage_data" "422")
    print_result "Error - Invalid Coverage Zone Data" "$result" ""
}

# Función para testear un microservicio interno
test_microservice_internal() {
    local service_name="$1"
    local base_url="$2"
    
    echo -e "${PURPLE}🧪 TESTING $service_name - ENDPOINTS INTERNOS${NC}"
    echo -e "${PURPLE}============================================${NC}"
    
    # Verificar que el servicio está activo
    if ! check_service "$service_name" "$base_url"; then
        echo -e "${YELLOW}⚠️  Saltando tests de $service_name (no está activo)${NC}"
        return 1
    fi
    
    # Tests específicos por servicio
    case $service_name in
        "config-service")
            test_config_internal "$base_url"
            ;;
        "stock-integration-service")
            test_stock_integration_internal "$base_url"
            ;;
        "shipping-service")
            test_shipping_internal "$base_url"
            ;;
        "operator-interface-service")
            test_operator_interface_internal "$base_url"
            ;;
    esac
    
    echo ""
}

# Función principal
main() {
    echo -e "${BLUE}🚀 INICIANDO TESTING DE ENDPOINTS INTERNOS${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo ""
    
    # Testear cada microservicio interno
    for service_name in "${!INTERNAL_SERVICES[@]}"; do
        test_microservice_internal "$service_name" "${INTERNAL_SERVICES[$service_name]}"
    done
    
    # Tests de casos de error
    test_internal_error_cases
    
    # Resumen final
    echo -e "${BLUE}📊 RESUMEN DE TESTING INTERNO${NC}"
    echo -e "${BLUE}==============================${NC}"
    echo -e "${BLUE}Total de tests: ${TESTS_TOTAL}${NC}"
    echo -e "${GREEN}Tests exitosos: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Tests fallidos: ${TESTS_FAILED}${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 ¡TODOS LOS TESTS INTERNOS PASARON!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  ALGUNOS TESTS INTERNOS FALLARON${NC}"
        echo -e "${YELLOW}Revisa los logs arriba para más detalles${NC}"
        exit 1
    fi
}

# Ejecutar función principal
main