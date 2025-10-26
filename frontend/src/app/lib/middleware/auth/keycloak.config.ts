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
  silentCheckSsoRedirectUri: `${envConfig.frontendUrl}/silent-check-sso.html`,
};
