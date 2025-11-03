'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getKeycloak } from '@/app/lib/middleware/auth/keycloak.config';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    token: null as string | null,
  });

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = async () => {
      try {
        const keycloak = getKeycloak();
        const token = localStorage.getItem('auth_token');

        if (token && keycloak?.authenticated) {
          console.log('✅ Usuario autenticado, redirigiendo a dashboard');
          setAuthState({ isAuthenticated: true, token });
          // Pequeño delay para que se vea bien
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        } else {
          console.log('❌ Usuario no autenticado, mostrando página de login');
          setAuthState({ isAuthenticated: false, token: null });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoading(false);
      }
    };

    // Esperar un poco para que Keycloak se inicialice
    setTimeout(checkAuth, 500);
  }, [router]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const keycloak = getKeycloak();
      if (keycloak) {
        console.log('🔐 Iniciando login con Keycloak');
        await keycloak.login();
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      setIsLoading(false);
    }
  };

  // Si está autenticado, mostrar mensaje de redirección
  if (authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin mb-4">
            <svg className="w-16 h-16 text-indigo-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirigiendo...</h1>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  // Si está en loading, mostrar spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin mb-4">
            <svg className="w-16 h-16 text-indigo-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inicializando...</h1>
          <p className="text-gray-600">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  // Página de login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PEPACK</h1>
          <p className="text-gray-600 mt-2">Gestión Logística y de BOCA</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
            <p className="text-gray-600">Inicia sesión para acceder a tu dashboard</p>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciando sesión...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Iniciar Sesión con Keycloak
              </>
            )}
          </button>

          {/* Features */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Gestión de Envíos</p>
                <p className="text-sm text-gray-600">Controla todos tus envíos en tiempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Optimización de Rutas</p>
                <p className="text-sm text-gray-600">Mejora la eficiencia de tus entregas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Análisis Completo</p>
                <p className="text-sm text-gray-600">Dashboard con métricas detalladas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Sistema de gestión logística • Versión 1.0
        </p>
      </div>
    </div>
  );
}
