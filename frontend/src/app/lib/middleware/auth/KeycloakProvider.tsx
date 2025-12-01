"use client";
import React, { useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';
import Keycloak from 'keycloak-js';
import { initializeKeycloak } from './keycloak.config';
import { authStore } from '../stores/auth.store';

// ============================================================================
// TIPOS Y CONTEXTO
// ============================================================================

interface KeycloakContextValue {
  keycloak: Keycloak | null;
  initialized: boolean;
  authenticated: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
}

const KeycloakContext = createContext<KeycloakContextValue>({
  keycloak: null,
  initialized: false,
  authenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
});

export const useKeycloak = () => useContext(KeycloakContext);

// ============================================================================
// PROVIDER PRINCIPAL
// ============================================================================

export const KeycloakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const initRef = useRef(false);

  // Función de login - redirige a Keycloak
  const login = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if (keycloak) {
      keycloak.login({
        redirectUri: `${window.location.origin}/auth/callback`,
      });
    } else {
      // Crear instancia y hacer login
      const kc = initializeKeycloak();
      kc.login({
        redirectUri: `${window.location.origin}/auth/callback`,
      });
    }
  }, [keycloak]);

  // Función de logout
  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    authStore.setToken(null);
    setToken(null);
    setAuthenticated(false);
    
    if (keycloak) {
      keycloak.logout({
        redirectUri: window.location.origin,
      });
    } else {
      window.location.href = '/';
    }
  }, [keycloak]);

  // Inicialización
  useEffect(() => {
    if (initRef.current || initialized) return;
    if (typeof window === 'undefined') return;

    initRef.current = true;
    const currentPath = window.location.pathname;

    // Si estamos en /auth/callback, NO inicializar Keycloak aquí
    // La página de callback lo manejará
    if (currentPath === '/auth/callback' || currentPath.startsWith('/auth/')) {
      console.log('📍 En ruta de auth, saltando inicialización del provider');
      setInitialized(true);
      return;
    }

    // Para otras rutas, solo verificar si hay token válido en localStorage
    // NO hacer check-sso automático para evitar redirecciones
    const existingToken = localStorage.getItem('auth_token');
    
    if (existingToken && isTokenValid(existingToken)) {
      console.log('✅ Token válido encontrado en localStorage');
      setToken(existingToken);
      setAuthenticated(true);
      authStore.setToken(existingToken);
      
      // Crear instancia de Keycloak para futuras operaciones (sin init)
      const kc = initializeKeycloak();
      setKeycloak(kc);
    } else {
      console.log('❌ No hay token válido');
      localStorage.removeItem('auth_token');
      setAuthenticated(false);
    }
    
    setInitialized(true);
  }, [initialized]);

  const contextValue: KeycloakContextValue = {
    keycloak,
    initialized,
    authenticated,
    token,
    login,
    logout,
  };

  return (
    <KeycloakContext.Provider value={contextValue}>
      {children}
    </KeycloakContext.Provider>
  );
};

// Función helper para validar token
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export default KeycloakProvider;
