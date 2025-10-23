#!/bin/bash

# Script para activar el entorno virtual del Spec Kit
# Uso: source activate-spec-kit.sh

echo "🚀 Activando GitHub Spec Kit para desarrollo..."

# Activar entorno virtual
source spec-kit-env/bin/activate

# Verificar instalación
echo "✅ Entorno virtual activado"
echo "📦 Spec Kit disponible: $(which specify)"

# Mostrar comandos disponibles
echo ""
echo "🔧 Comandos disponibles:"
echo "  specify --help          - Ver ayuda del Spec Kit"
echo "  specify check           - Verificar herramientas instaladas"
echo ""
echo "💡 Comandos de desarrollo:"
echo "  /speckit.plan          - Crear plan de implementación"
echo "  /speckit.spec          - Generar especificación"
echo "  /speckit.tasks         - Desglosar tareas"
echo "  /speckit.implement     - Ejecutar implementación"
echo ""
echo "🎯 ¡Listo para desarrollo especificado!"
