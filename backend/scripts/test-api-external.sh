#!/bin/bash

# ===================================
# SCRIPT DE TESTING API EXTERNA - MICROSERVICIOS
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

# Cargar configuración de testing
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/testing-config.sh" ]; then
    source "$SCRIPT_DIR/testing-config.sh"
fi

# Configuración - URLs externas de microservicios
EXTERNAL_URL="${EXTERNAL_URL:-http://localhost:3000}"
API_BASE="$EXTERNAL_URL"

echo -e "${BLUE}🌐 TESTING API EXTERNA - MICROSERVICIOS${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}🔗 URL Base: $API_BASE${NC}"
echo ""

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
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
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

# Función para verificar conectividad
check_connectivity() {
    echo -e "${BLUE}🔍 VERIFICANDO CONECTIVIDAD${NC}"
    echo -e "${BLUE}============================${NC}"
    
    if curl -s -f "$API_BASE/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Servidor externo está accesible${NC}"
        return 0
    else
        echo -e "${RED}❌ Servidor externo no está accesible${NC}"
        echo -e "${YELLOW}💡 Verifica que el servidor esté corriendo en $API_BASE${NC}"
        return 1
    fi
}

# Tests de endpoints externos (públicos)
test_external_endpoints() {
    echo -e "${BLUE}🌐 TESTING ENDPOINTS EXTERNOS${NC}"
    echo -e "${BLUE}==============================${NC}"
    
    # Health check
    result=$(make_request "GET" "/health" "" "200")
    print_result "External Health Check" "$result" ""
    
    # Service info
    result=$(make_request "GET" "/" "" "200")
    print_result "External Service Info" "$result" ""
    
    # Transport methods (external endpoint)
    result=$(make_request "GET" "/transport-methods" "" "200")
    print_result "Get External Transport Methods" "$result" ""
    
    # Coverage zones (external endpoint)
    result=$(make_request "GET" "/coverage-zones" "" "200")
    print_result "Get External Coverage Zones" "$result" ""
    
    # Shipping cost calculation
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
    
    result=$(make_request "POST" "/shipping/cost" "$cost_data" "200")
    print_result "Calculate External Shipping Cost" "$result" ""
    
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
    
    result=$(make_request "POST" "/shipping" "$shipping_data" "201")
    print_result "Create External Shipping" "$result" ""
    
    # Get all shippings
    result=$(make_request "GET" "/shipping" "" "200")
    print_result "Get All External Shippings" "$result" ""
    
    # Get shipping by ID
    result=$(make_request "GET" "/shipping/1" "" "200")
    print_result "Get External Shipping by ID" "$result" ""
    
    # Cancel shipping
    cancel_data='{
        "reason": "Cliente solicitó cancelación",
        "cancelled_by": "customer"
    }'
    
    result=$(make_request "POST" "/shipping/1/cancel" "$cancel_data" "200")
    print_result "Cancel External Shipping" "$result" ""
}

# Tests de casos de error
test_error_cases() {
    echo -e "${BLUE}🚨 TESTING CASOS DE ERROR${NC}"
    echo -e "${BLUE}==========================${NC}"
    
    # Producto no encontrado
    error_cost_data='{
        "products": [
            {
                "id": 999,
                "quantity": 1
            }
        ],
        "delivery_address": {
            "street": "Test 123",
            "city": "Test City",
            "state": "Test",
            "postal_code": "1234",
            "country": "Argentina"
        }
    }'
    
    result=$(make_request "POST" "/shipping/cost" "$error_cost_data" "400")
    print_result "Error - Product Not Found" "$result" ""
    
    # Shipping no encontrado
    result=$(make_request "GET" "/shipping/999" "" "404")
    print_result "Error - Shipping Not Found" "$result" ""
    
    # Datos inválidos
    error_shipping_data='{
        "products": [],
        "delivery_address": {},
        "transport_type": "invalid"
    }'
    
    result=$(make_request "POST" "/shipping" "$error_shipping_data" "422")
    print_result "Error - Invalid Data" "$result" ""
}

# Tests de performance
test_performance() {
    echo -e "${BLUE}⚡ TESTING PERFORMANCE${NC}"
    echo -e "${BLUE}======================${NC}"
    
    # Health check performance
    start_time=$(date +%s%N)
    result=$(make_request "GET" "/health" "" "200")
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$result" = "PASS" ]; then
        print_result "Health Check Performance (${duration}ms)" "$result" ""
    else
        print_result "Health Check Performance (${duration}ms)" "$result" ""
    fi
    
    # Transport methods performance
    start_time=$(date +%s%N)
    result=$(make_request "GET" "/transport-methods" "" "200")
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$result" = "PASS" ]; then
        print_result "Transport Methods Performance (${duration}ms)" "$result" ""
    else
        print_result "Transport Methods Performance (${duration}ms)" "$result" ""
    fi
}

# Función principal
main() {
    echo -e "${BLUE}🚀 INICIANDO TESTING DE API EXTERNA${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    
    # Verificar conectividad
    if ! check_connectivity; then
        echo -e "${RED}❌ No se puede conectar al servidor externo${NC}"
        echo -e "${YELLOW}💡 Verifica que el servidor esté corriendo en $API_BASE${NC}"
        exit 1
    fi
    
    # Ejecutar tests
    test_external_endpoints
    test_error_cases
    test_performance
    
    # Resumen final
    echo -e "${BLUE}📊 RESUMEN DE TESTING EXTERNO${NC}"
    echo -e "${BLUE}==============================${NC}"
    echo -e "${BLUE}Total de tests: ${TESTS_TOTAL}${NC}"
    echo -e "${GREEN}Tests exitosos: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Tests fallidos: ${TESTS_FAILED}${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 ¡TODOS LOS TESTS EXTERNOS PASARON!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  ALGUNOS TESTS EXTERNOS FALLARON${NC}"
        echo -e "${YELLOW}Revisa los logs arriba para más detalles${NC}"
        exit 1
    fi
}

# Ejecutar función principal
main