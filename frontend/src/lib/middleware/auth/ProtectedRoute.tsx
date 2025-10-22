import React from 'react';
import { authStore } from '../stores/auth.store';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let isAuth = false;
  const unsub = authStore.subscribe((s) => { isAuth = s.isAuthenticated; });
  unsub();

  if (!isAuth) {
    return (
      <div style={{ padding: 24 }}>
        <h2>No autorizado</h2>
        <p>Por favor inicie sesión para continuar.</p>
      </div>
    );
  }
  return <>{children}</>;
};
