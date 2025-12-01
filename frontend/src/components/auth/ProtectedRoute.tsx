'use client';

import React, { useEffect, useState } from 'react';
import { useKeycloak } from '@/app/lib/middleware/auth/KeycloakProvider';

// ============================================================================
// TIPOS
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles requeridos (opcional) - el usuario debe tener al menos uno */
  requiredRoles?: string[];
  /** Componente a mostrar mientras se carga */
  loadingComponent?: React.ReactNode;
  /** Componente a mostrar si no está autorizado */
  unauthorizedComponent?: React.ReactNode;
  /** Redirigir al login automáticamente si no está autenticado */
  redirectToLogin?: boolean;
  /** URL de redirección personalizada */
  redirectUrl?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ProtectedRoute({
  children,
  requiredRoles,
  loadingComponent,
  unauthorizedComponent,
  redirectToLogin = true,
  redirectUrl = '/',
}: ProtectedRouteProps) {
  const { initialized, authenticated, keycloak, login } = useKeycloak();
  const [hasRequiredRole, setHasRequiredRole] = useState<boolean | null>(null);

  useEffect(() => {
    if (!initialized) return;

    // Si hay roles requeridos, verificar
    if (requiredRoles && requiredRoles.length > 0 && keycloak) {
      const userRoles = keycloak.realmAccess?.roles || [];
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      setHasRequiredRole(hasRole);
    } else {
      setHasRequiredRole(true); // No hay roles requeridos
    }

    // Si no está autenticado y debe redirigir
    if (!authenticated && redirectToLogin) {
      console.log('🔒 Usuario no autenticado, redirigiendo...');
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    }
  }, [initialized, authenticated, keycloak, requiredRoles, redirectToLogin, redirectUrl]);

  // Mientras se inicializa Keycloak
  if (!initialized) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Si no está autenticado
  if (!authenticated) {
    if (!redirectToLogin) {
      return unauthorizedComponent || <DefaultUnauthorizedComponent onLogin={login} />;
    }
    // Si redirectToLogin es true, ya se maneja en useEffect
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Si no tiene el rol requerido
  if (hasRequiredRole === false) {
    return unauthorizedComponent || <DefaultForbiddenComponent />;
  }

  // Si aún se está verificando el rol
  if (hasRequiredRole === null) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Todo OK, renderizar children
  return <>{children}</>;
}

// ============================================================================
// COMPONENTES POR DEFECTO
// ============================================================================

function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4">
          <svg className="animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-slate-400">Verificando autenticación...</p>
      </div>
    </div>
  );
}

function DefaultUnauthorizedComponent({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center max-w-md mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
        <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
        <p className="text-slate-300 mb-6">Necesitas iniciar sesión para acceder a esta página.</p>
        <button
          onClick={onLogin}
          className="w-full bg-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
}

function DefaultForbiddenComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center max-w-md mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
        <p className="text-slate-300 mb-6">No tienes permisos suficientes para acceder a esta página.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-slate-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-500 transition-all"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ProtectedRoute;

