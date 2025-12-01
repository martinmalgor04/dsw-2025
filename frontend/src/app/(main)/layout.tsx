"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

/**
 * Verifica si un token JWT es válido (no expirado)
 */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  } catch {
    return false;
  }
}

/**
 * Layout compartido para todas las páginas principales (protegidas)
 * Requiere autenticación - redirige a / si no hay token válido
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificación inmediata de token
    const token = localStorage.getItem('auth_token');
    
    if (isTokenValid(token)) {
      // Token válido, permitir acceso
      setIsAuthorized(true);
    } else {
      // Sin token válido, redirigir inmediatamente al login
      console.log('🔒 Sin sesión válida, redirigiendo al login...');
      router.replace('/');
    }
  }, [router]);

  // Si no está autorizado, no mostrar nada (se está redirigiendo)
  if (isAuthorized !== true) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <svg className="animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-slate-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Usuario autorizado, mostrar contenido
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
