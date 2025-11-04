'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de callback de Keycloak
 * Keycloak redirige aquí después de autenticación exitosa
 * Esta página simplemente redirige al dashboard después de un pequeño delay
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('📍 En página de callback de Keycloak');

        // Keycloak ya procesó el authorization code durante el init
        // El token ya está guardado en KeycloakProvider
        // Solo redirigir al dashboard después de un pequeño delay

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Redirigiendo al dashboard');
        setIsProcessing(false);
        router.push('/dashboard');
      } catch (error) {
        console.error('❌ Error en callback:', error);
        setIsProcessing(false);
        router.push('/');
      }
    };

    // Solo ejecutar una vez
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          {isProcessing ? 'Procesando autenticación...' : 'Redirigiendo...'}
        </h1>
        <p className="text-gray-600">Por favor espera mientras completamos tu login.</p>
      </div>
    </div>
  );
}
