#!/bin/bash

# ===================================
# SCRIPT DE TESTING AUTOMATIZADO
# API de Logística - Grupo 12 TPI 2025
# ===================================

# Configuración
API_BASE_URL="http://144.22.130.30:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE_URL$endpoint" \
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

echo -e "${BLUE}🚀 INICIANDO TESTING AUTOMATIZADO DE LA API${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${YELLOW}Servidor: $API_BASE_URL${NC}"
echo ""

# ===================================
# TEST 1: Health Check
# ===================================
echo -e "${BLUE}🏠 TESTING ENDPOINTS GENERALES${NC}"
echo "----------------------------------------"

result=$(make_request "GET" "/health" "" "200")
print_result "Health Check" "$result" ""

result=$(make_request "GET" "/" "" "200")
print_result "API Info" "$result" ""

echo ""

# ===================================
# TEST 2: Métodos de Transporte
# ===================================
echo -e "${BLUE}🚛 TESTING MÉTODOS DE TRANSPORTE${NC}"
echo "----------------------------------------"

result=$(make_request "GET" "/transport-methods" "" "200")
print_result "Obtener Métodos de Transporte" "$result" ""

echo ""

# ===================================
# TEST 3: Cálculo de Costos
# ===================================
echo -e "${BLUE}💰 TESTING CÁLCULO DE COSTOS${NC}"
echo "----------------------------------------"

# Test 3.1: Cálculo básico
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
print_result "Calcular Costo - Método Standard" "$result" ""

# Test 3.2: Cálculo Express
cost_express_data='{
  "products": [
    {
      "id": 1,
      "quantity": 1
    }
  ],
  "delivery_address": {
    "street": "Córdoba 567",
    "city": "Buenos Aires",
    "state": "CABA",
    "postal_code": "C1054ABC",
    "country": "AR"
  }
}'

result=$(make_request "POST" "/shipping/cost" "$cost_express_data" "200")
print_result "Calcular Costo - Método Express" "$result" ""

# Test 3.3: Cálculo con múltiples productos
cost_multi_data='{
  "products": [
    {
      "id": 1,
      "quantity": 2
    },
    {
      "id": 2,
      "quantity": 1
    }
  ],
  "delivery_address": {
    "street": "Mitre 890",
    "city": "Córdoba",
    "state": "Córdoba",
    "postal_code": "X5000ABC",
    "country": "AR"
  }
}'

result=$(make_request "POST" "/shipping/cost" "$cost_multi_data" "200")
print_result "Calcular Costo - Múltiples Productos" "$result" ""

echo ""

# ===================================
# TEST 4: Creación de Envíos
# ===================================
echo -e "${BLUE}📦 TESTING CREACIÓN DE ENVÍOS${NC}"
echo "----------------------------------------"

# Test 4.1: Crear envío básico
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
print_result "Crear Envío - Método Standard" "$result" ""

# Test 4.2: Crear envío Express
shipping_express_data='{
  "products": [
    {
      "id": 2,
      "quantity": 1
    }
  ],
  "delivery_address": {
    "street": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "state": "CABA",
    "postal_code": "C1043ABC",
    "country": "AR"
  },
  "transport_type": "air",
  "user_id": 2,
  "order_id": 2
}'

result=$(make_request "POST" "/shipping" "$shipping_express_data" "201")
print_result "Crear Envío - Método Express" "$result" ""

echo ""

# ===================================
# TEST 5: Consultas de Envíos
# ===================================
echo -e "${BLUE}🔍 TESTING CONSULTAS DE ENVÍOS${NC}"
echo "----------------------------------------"

# Test 5.1: Listar envíos
result=$(make_request "GET" "/shipping" "" "200")
print_result "Listar Todos los Envíos" "$result" ""

# Test 5.2: Filtrar por estado
result=$(make_request "GET" "/shipping?status=pending" "" "200")
print_result "Filtrar Envíos por Estado" "$result" ""

# Test 5.3: Obtener detalles de envío
result=$(make_request "GET" "/shipping/1" "" "200")
print_result "Obtener Detalles de Envío ID 1" "$result" ""

echo ""

# ===================================
# TEST 6: Cancelación de Envíos
# ===================================
echo -e "${BLUE}❌ TESTING CANCELACIÓN DE ENVÍOS${NC}"
echo "----------------------------------------"

# Test 6.1: Cancelar envío
cancel_data='{
  "reason": "Cliente solicitó cancelación",
  "cancelled_by": "customer"
}'

result=$(make_request "POST" "/shipping/1/cancel" "$cancel_data" "200")
print_result "Cancelar Envío" "$result" ""

echo ""

# ===================================
# TEST 7: Casos de Error
# ===================================
echo -e "${BLUE}🚨 TESTING CASOS DE ERROR${NC}"
echo "----------------------------------------"

# Test 7.1: Producto no encontrado
error_cost_data='{
  "products": [
    {
      "id": 999,
      "quantity": 1
    }
  ],
  "destination": {
    "street": "Test 123",
    "city": "Test City",
    "province": "Test",
    "postal_code": "1234",
    "country": "Argentina"
  },
  "transport_method": "standard"
}'

result=$(make_request "POST" "/shipping/cost" "$error_cost_data" "400")
print_result "Error - Producto No Encontrado" "$result" ""

# Test 7.2: Envío no encontrado
result=$(make_request "GET" "/shipping/999" "" "404")
print_result "Error - Envío No Encontrado" "$result" ""

# Test 7.3: Datos inválidos
error_shipping_data='{
  "products": [],
  "destination": {},
  "transport_method": "invalid"
}'

result=$(make_request "POST" "/shipping" "$error_shipping_data" "422")
print_result "Error - Datos Inválidos" "$result" ""

echo ""

# ===================================
# RESUMEN FINAL
# ===================================
echo -e "${BLUE}📊 RESUMEN DE TESTING${NC}"
echo "==============================================="
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
