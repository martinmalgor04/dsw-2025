import Keycloak from 'keycloak-js';
import { envConfig } from '../../config/env.config';

// IMPORTANTE: La instancia de Keycloak se crea de forma lazy en KeycloakProvider
// No crear aquí para evitar problemas con SSR
let keycloakInstance: Keycloak | null = null;

export function initializeKeycloak(): Keycloak {
  if (keycloakInstance) {
    return keycloakInstance;
  }

  const keycloakUrl = envConfig.keycloak.url;

  if (!keycloakUrl || keycloakUrl === '') {
    const errorMsg = '❌ ERROR: NEXT_PUBLIC_KEYCLOAK_URL no está configurada en .env\n\n' +
      'Agrega al archivo .env:\n' +
      'NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080\n\n' +
      'Luego reinicia el servidor de desarrollo.';

    console.error(errorMsg);
  }

  const finalKeycloakUrl = keycloakUrl || 'http://localhost:8080';

  console.log('🔧 Creando instancia de Keycloak:', {
    url: finalKeycloakUrl,
    realm: envConfig.keycloak.realm,
    clientId: envConfig.keycloak.clientId,
  });

  keycloakInstance = new Keycloak({
    url: finalKeycloakUrl,
    realm: envConfig.keycloak.realm,
    clientId: envConfig.keycloak.clientId,
  });

  return keycloakInstance;
}

export function getKeycloak(): Keycloak | null {
  return keycloakInstance;
}

export const keycloakInitOptions = {
  // 'login-required' solo en la página principal para forzar login
  // En el callback, se usa 'check-sso' para evitar loops
  onLoad: undefined as any, // No usar onLoad automático - manejar manualmente
  pkceMethod: 'S256' as any, // PKCE habilitado para producción (Web Crypto API)
  checkLoginIframe: false,
  enableLogging: true,
  // Redirigir a la página de callback que maneja la autenticación
  redirectUri: typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'http://localhost:3000/auth/callback',
};
