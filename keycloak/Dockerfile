# Dockerfile para Keycloak en Dokploy
# Usa la imagen oficial de Keycloak versión 23.0.6 (como en docker-compose.yml)
# Importa el realm ds-2025-realm automáticamente desde ds-2025-realm.json

FROM quay.io/keycloak/keycloak:23.0.6

# Verificar que el directorio realm-config existe antes de copiar
# Copiar configuración del realm a /opt/keycloak/data/import/
# Keycloak buscará archivos .json en este directorio cuando se use --import-realm
COPY realm-config/ds-2025-realm.json /opt/keycloak/data/import/ds-2025-realm.json

# Verificar que el archivo se copió correctamente (solo en build, para debugging)
RUN ls -la /opt/keycloak/data/import/ && \
    echo "✅ Archivo realm copiado correctamente" && \
    test -f /opt/keycloak/data/import/ds-2025-realm.json && \
    echo "✅ ds-2025-realm.json encontrado" || \
    (echo "❌ ERROR: ds-2025-realm.json no encontrado" && exit 1)

# Configurar variables de entorno por defecto
# Estas pueden ser sobrescritas en Dokploy desde las variables de entorno
ENV KC_HOSTNAME=localhost
ENV KC_HOSTNAME_PORT=8080
ENV KC_HOSTNAME_STRICT_BACKCHANNEL=false
ENV KC_HTTP_ENABLED=true
ENV KC_HOSTNAME_STRICT_HTTPS=false
ENV KC_HEALTH_ENABLED=true
ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=ds2025
ENV KC_DB=postgres

# Exponer puerto
EXPOSE 8080

# Comando de inicio con importación automática del realm
# --import-realm importa automáticamente todos los archivos .json desde /opt/keycloak/data/import/
# Solo importa en el primer inicio si el realm no existe
CMD ["start", "--import-realm", "--hostname-strict=false"]
