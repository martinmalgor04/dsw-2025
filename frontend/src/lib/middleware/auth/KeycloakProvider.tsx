import React, { useEffect, useState } from 'react';
import { keycloak, keycloakInitOptions } from './keycloak.config';
import { authStore } from '../stores/auth.store';

export const KeycloakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const authenticated = await keycloak.init(keycloakInitOptions);
        if (authenticated && keycloak.token) authStore.setToken(keycloak.token);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div>Verificando autenticación...</div>
      </div>
    );
  }

  return <>{children}</>;
};
