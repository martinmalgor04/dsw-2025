'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getKeycloak } from '@/app/lib/middleware/auth/keycloak.config';

/**
 * Página de callback de Keycloak
 * Keycloak redirige aquí después de autenticación exitosa
 * Esta página procesa el authorization code y redirige al dashboard
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('📍 En página de callback, procesando autenticación...');

        const keycloak = getKeycloak();

        if (!keycloak) {
          console.error('❌ Keycloak no inicializado');
          router.push('/');
          return;
        }

        // El init de Keycloak ya procesó el código
        // Solo redirigir al dashboard
        console.log('✅ Autenticación procesada, redirigiendo...');

        // Dar un pequeño delay para asegurar que el token se guardó
        await new Promise(resolve => setTimeout(resolve, 500));

        router.push('/dashboard');
      } catch (error) {
        console.error('❌ Error en callback:', error);
        router.push('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Procesando autenticación...</h1>
        <p className="text-gray-600">Por favor espera mientras completamos tu login.</p>
      </div>
    </div>
  );
}
