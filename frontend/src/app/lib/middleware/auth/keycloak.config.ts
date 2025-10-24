import Keycloak from 'keycloak-js';
import { envConfig } from '../../config/env.config';

export const keycloak = new Keycloak({
  url: envConfig.keycloak.url,
  realm: envConfig.keycloak.realm,
  clientId: envConfig.keycloak.clientId,
});

export const keycloakInitOptions = {
  onLoad: 'check-sso' as const,
  pkceMethod: 'S256' as const,
  checkLoginIframe: false,
  silentCheckSsoRedirectUri: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/silent-check-sso.html`,
};
