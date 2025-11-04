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
ENV KC_HOSTNAME: ${KC_HOSTNAME}
ENV KC_HOSTNAME_PORT: ${KC_HOSTNAME_PORT:-443}
ENV KC_HOSTNAME_STRICT: ${KC_HOSTNAME_STRICT:-false}
ENV KC_HOSTNAME_STRICT_BACKCHANNEL: ${KC_HOSTNAME_STRICT_BACKCHANNEL:-false}
ENV KC_HTTP_ENABLED: ${KC_HTTP_ENABLED:-true}
ENV KC_HOSTNAME_STRICT_HTTPS: ${KC_HOSTNAME_STRICT_HTTPS:-false}
ENV KC_HEALTH_ENABLED: ${KC_HEALTH_ENABLED:-true}
ENV KC_PROXY: ${KC_PROXY:-edge}
ENV KC_PROXY_ADDRESS_FORWARDING: ${KC_PROXY_ADDRESS_FORWARDING:-true}
ENV KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN}
ENV KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
ENV KC_DB: postgres
ENV KC_DB_URL: jdbc:postgresql://postgres/${POSTGRES_DB}
ENV KC_DB_USERNAME: ${POSTGRES_USER}
ENV KC_DB_PASSWORD: ${POSTGRES_PASSWORD}

# Exponer puerto
EXPOSE 443

# Comando de inicio con importación automática del realm
# --import-realm importa automáticamente todos los archivos .json desde /opt/keycloak/data/import/
# Solo importa en el primer inicio si el realm no existe
CMD ["start", "--import-realm", "--hostname-strict=false"]
