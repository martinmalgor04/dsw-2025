'use client';

import React, { useEffect, useState } from 'react';
import Keycloak from 'keycloak-js';
import { envConfig } from '@/app/lib/config/env.config';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && isTokenValid(token)) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    // Crear instancia de Keycloak directamente
    const keycloak = new Keycloak({
      url: envConfig.keycloak.url,
      realm: envConfig.keycloak.realm,
      clientId: envConfig.keycloak.clientId,
    });

    console.log('🔐 Redirigiendo a Keycloak:', {
      url: envConfig.keycloak.url,
      realm: envConfig.keycloak.realm,
      clientId: envConfig.keycloak.clientId,
    });

    // Redirigir directamente a Keycloak (sin init previo)
    const redirectUri = `${window.location.origin}/auth/callback`;
    const loginUrl = `${envConfig.keycloak.url}/realms/${envConfig.keycloak.realm}/protocol/openid-connect/auth?client_id=${envConfig.keycloak.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`;
    
    console.log('🔗 Login URL:', loginUrl);
    window.location.href = loginUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido!</h1>
            <p className="text-gray-600 mt-2">Ya tienes una sesión activa</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Ir al Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-all text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PEPACK</h1>
          <p className="text-gray-600 mt-2">Gestión Logística y de BOCA</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
            <p className="text-gray-600">Inicia sesión para acceder a tu dashboard</p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar Sesión con Keycloak
          </button>

          <div className="pt-6 border-t border-gray-200 space-y-3">
            <Feature title="Gestión de Envíos" desc="Controla todos tus envíos en tiempo real" />
            <Feature title="Optimización de Rutas" desc="Mejora la eficiencia de tus entregas" />
            <Feature title="Análisis Completo" desc="Dashboard con métricas detalladas" />
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          Sistema de gestión logística • Versión 1.0
        </p>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

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
