#!/bin/bash

# ===================================
# Script de Verificación Pre-Commit
# Logística Grupo 12 - TPI 2025
# ===================================

echo "🔍 Verificando proyecto antes de commit/push..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# ===================================
# Función para verificar
# ===================================
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        ((ERRORS++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

info() {
    echo -e "ℹ️  $1"
}

# ===================================
# 1. Verificar archivos requeridos
# ===================================
echo "📁 Verificando archivos requeridos..."

[ -f "package.json" ] && check "package.json existe" || warn "package.json NO encontrado"
[ -f ".gitignore" ] && check ".gitignore existe" || warn ".gitignore NO encontrado"
[ -f ".env.example" ] && check ".env.example existe" || warn ".env.example NO encontrado"
[ -f "README.md" ] && check "README.md existe" || warn "README.md NO encontrado"
[ -f "docker-compose.yml" ] && check "docker-compose.yml existe" || warn "docker-compose.yml NO encontrado"
[ -f "openapilog.yaml" ] && check "openapilog.yaml existe" || warn "openapilog.yaml NO encontrado"
[ -f "prisma/schema.prisma" ] && check "prisma/schema.prisma existe" || warn "schema.prisma NO encontrado"

echo ""

# ===================================
# 2. Verificar que archivos NO deban estar
# ===================================
echo "🚫 Verificando archivos que NO deben estar trackeados..."

if [ -d "node_modules" ] && git ls-files --error-unmatch node_modules >/dev/null 2>&1; then
    warn "node_modules/ está trackeado en Git (NO debería)"
else
    check "node_modules/ NO está trackeado"
fi

if [ -f ".env" ] && git ls-files --error-unmatch .env >/dev/null 2>&1; then
    warn ".env está trackeado en Git (NO debería)"
else
    check ".env NO está trackeado"
fi

if [ -d "dist" ] && git ls-files --error-unmatch dist >/dev/null 2>&1; then
    warn "dist/ está trackeado en Git (NO debería)"
else
    check "dist/ NO está trackeado"
fi

echo ""

# ===================================
# 3. Verificar Git
# ===================================
echo "🔀 Verificando configuración de Git..."

if git remote -v | grep -q "FRRe-DS/2025-12-TPI"; then
    check "Remote apunta al repositorio correcto"
else
    warn "Remote NO apunta a FRRe-DS/2025-12-TPI"
fi

BRANCH=$(git branch --show-current)
info "Rama actual: $BRANCH"

if git diff-index --quiet HEAD --; then
    check "No hay cambios sin commitear"
else
    warn "Hay cambios sin commitear"
fi

echo ""

# ===================================
# 4. Verificar package.json
# ===================================
echo "📦 Verificando package.json..."

if grep -q '"name": "logistica-grupo12-tpi"' package.json; then
    check "Nombre del proyecto correcto"
else
    warn "Nombre del proyecto incorrecto en package.json"
fi

if grep -q '"license": "Apache-2.0"' package.json; then
    check "Licencia correcta (Apache-2.0)"
else
    warn "Licencia incorrecta en package.json"
fi

if grep -q "FRRe-DS/2025-12-TPI" package.json; then
    check "URL del repositorio correcta"
else
    warn "URL del repositorio incorrecta en package.json"
fi

echo ""

# ===================================
# 5. Verificar estructura de carpetas
# ===================================
echo "📂 Verificando estructura de carpetas..."

[ -d "src" ] && check "src/ existe" || warn "src/ NO existe"
[ -d "test" ] && check "test/ existe" || warn "test/ NO existe"
[ -d "prisma" ] && check "prisma/ existe" || warn "prisma/ NO existe"

echo ""

# ===================================
# 6. Verificar dependencias
# ===================================
echo "📚 Verificando dependencias..."

if [ -d "node_modules" ]; then
    check "node_modules/ instalado"
else
    warn "node_modules/ NO existe - ejecuta 'npm install'"
fi

if [ -f "package-lock.json" ]; then
    check "package-lock.json existe"
else
    info "package-lock.json no existe (opcional)"
fi

echo ""

# ===================================
# 7. Verificar OpenAPI
# ===================================
echo "📄 Verificando OpenAPI..."

if [ -f "openapilog.yaml" ]; then
    if grep -q "openapi: 3.0" openapilog.yaml; then
        check "OpenAPI versión 3.0"
    else
        warn "OpenAPI versión incorrecta"
    fi
    
    if grep -q "title:" openapilog.yaml; then
        check "OpenAPI tiene título"
    else
        warn "OpenAPI sin título"
    fi
fi

echo ""

# ===================================
# 8. Verificar archivos de documentación
# ===================================
echo "📖 Verificando documentación..."

[ -f "CONTRIBUTING.md" ] && check "CONTRIBUTING.md existe" || info "CONTRIBUTING.md no existe (opcional)"
[ -f "SETUP-GITHUB.md" ] && check "SETUP-GITHUB.md existe" || info "SETUP-GITHUB.md no existe (opcional)"
[ -f "QUICK-START.md" ] && check "QUICK-START.md existe" || info "QUICK-START.md no existe (opcional)"

echo ""

# ===================================
# Resumen
# ===================================
echo "=================================="
echo "📊 RESUMEN"
echo "=================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Todo OK! Listo para commit/push${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS advertencia(s) - Revisa antes de continuar${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(es) y $WARNINGS advertencia(s)${NC}"
    echo ""
    echo "Por favor, corrige los errores antes de hacer commit/push"
    exit 1
fi
