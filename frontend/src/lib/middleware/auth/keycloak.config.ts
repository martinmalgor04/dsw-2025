import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: (import.meta as any)?.env?.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: (import.meta as any)?.env?.VITE_KEYCLOAK_REALM || 'logistica',
  clientId: (import.meta as any)?.env?.VITE_KEYCLOAK_CLIENT_ID || 'logix-frontend',
});

export const keycloakInitOptions = {
  onLoad: 'check-sso' as const,
  pkceMethod: 'S256' as const,
  checkLoginIframe: false,
  silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
};
