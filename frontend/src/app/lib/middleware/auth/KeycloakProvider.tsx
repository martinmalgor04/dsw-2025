"use client";
import React, { useEffect, useState, useRef } from 'react';
import { initializeKeycloak, keycloakInitOptions } from './keycloak.config';
import { authStore } from '../stores/auth.store';

export const KeycloakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevenir inicializaciones múltiples usando ref + estado
    // El ref evita inicializaciones durante hidratación, el estado previene nuevos efectos
    if (initializationRef.current || initialized) {
      return;
    }

    // Asegurar que solo se ejecuta en el cliente
    if (typeof window === 'undefined') {
      initializationRef.current = true;
      setInitialized(true);
      return;
    }

    initializationRef.current = true;

    (async () => {
      try {
        const currentPath = window.location.pathname;

        console.log('🔐 Inicializando Keycloak Provider en el cliente...');
        console.log('📍 Path actual:', currentPath);

        // Si estamos en /auth/callback, no hacer nada aquí
        // La página de callback maneja la autenticación
        if (currentPath === '/auth/callback') {
          console.log('📍 En página de callback, saltando inicialización');
          setInitialized(true);
          return;
        }

        // Limpiar callbacks y tokens viejos de Keycloak antes de inicializar
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('kc-callback-') || key.startsWith('KEYCLOAK_')) {
            localStorage.removeItem(key);
          }
        });

        // Inicializar Keycloak (solo en cliente)
        const keycloak = initializeKeycloak();

        // Configurar listeners antes de inicializar
        keycloak.onTokenExpired = () => {
          console.log('🔄 Token expirado, refrescando...');
          keycloak.updateToken(30).then((refreshed) => {
            if (refreshed && keycloak.token) {
              console.log('✅ Token refrescado exitosamente');
              authStore.setToken(keycloak.token);
            }
          }).catch((error) => {
            console.warn('❌ Error refrescando token:', error);
            // No forzar login automáticamente
            console.log('ℹ️ Token expiró, usuario puede hacer login nuevamente si es necesario');
          });
        };

        keycloak.onAuthSuccess = () => {
          console.log('✅ Autenticación exitosa');
          if (keycloak.token) {
            console.log('💾 Guardando token en localStorage');
            authStore.setToken(keycloak.token);
          }
        };

        keycloak.onAuthError = (error) => {
          console.error('❌ Error de autenticación:', error);
          authStore.setToken(null);
        };

        console.log('🔐 Inicializando Keycloak con opciones:', keycloakInitOptions);
        const authenticated = await keycloak.init(keycloakInitOptions);
        console.log('🔐 Keycloak init resultado - authenticated:', authenticated, 'token:', keycloak.token ? 'presente' : 'ausente');

        // Guardar token si existe
        if (keycloak.token) {
          console.log('💾 Token obtenido, guardando en store y localStorage');
          authStore.setToken(keycloak.token);
        } else if (authenticated === false) {
          console.log('ℹ️ Usuario no autenticado.');
          // No forzar login - dejar que cada ruta protegida maneje esto
        }
      } catch (error) {
        console.error('❌ Keycloak initialization error:', error);
        // Continuar sin fallar - las rutas pueden manejar autenticación faltante
      } finally {
        setInitialized(true);
      }
    })();
  }, []); // Solo ejecutar una vez al montar

  // No bloquear render - Keycloak se inicializa en background
  return <>{children}</>;
};
