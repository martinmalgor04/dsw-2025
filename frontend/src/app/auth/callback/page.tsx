'use client';

import { useEffect, useState, useRef } from 'react';
import { envConfig } from '@/app/lib/config/env.config';

type CallbackState = 'processing' | 'success' | 'error';

export default function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('processing');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      
      const code = urlParams.get('code');
      const error = urlParams.get('error') || hashParams.get('error');

      console.log('📍 Callback:', { 
        hasCode: !!code, 
        error,
        url: window.location.href 
      });

      // Si hay error
      if (error) {
        if (error === 'login_required') {
          window.location.replace('/');
          return;
        }
        setErrorMsg(error);
        setState('error');
        return;
      }

      // Si no hay código
      if (!code) {
        const token = localStorage.getItem('auth_token');
        if (token && isTokenValid(token)) {
          window.location.replace('/dashboard');
          return;
        }
        window.location.replace('/');
        return;
      }

      // Intercambiar código por token
      console.log('🔐 Intercambiando código por token...');
      
      const tokenUrl = `${envConfig.keycloak.url}/realms/${envConfig.keycloak.realm}/protocol/openid-connect/token`;
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: envConfig.keycloak.clientId,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error token exchange:', errorData);
        throw new Error('Error al obtener el token');
      }

      const tokenData = await response.json();
      console.log('✅ Token obtenido!', { 
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token 
      });

      // Guardar tokens
      localStorage.setItem('auth_token', tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem('auth_refresh_token', tokenData.refresh_token);
      }

      setState('success');
      
      // Limpiar URL y redirigir
      window.history.replaceState({}, '', '/auth/callback');
      
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 1000);

    } catch (err) {
      console.error('❌ Error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      setState('error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center max-w-md mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
        
        {state === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6">
              <svg className="animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-white">Iniciando sesión...</h1>
            <p className="text-slate-300">Por favor espera</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-white">¡Login Exitoso!</h1>
            <p className="text-slate-300">Redirigiendo al dashboard...</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-white">Error</h1>
            <p className="text-slate-300 mb-6">{errorMsg}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-600 transition-all"
            >
              Volver al Inicio
            </button>
          </>
        )}
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
