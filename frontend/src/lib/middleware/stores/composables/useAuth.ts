import { useEffect, useState } from 'react';
import { authStore, type AuthState } from '../auth.store';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsub = authStore.subscribe(setState);
    authStore.init();
    return () => unsub();
  }, []);

  return {
    ...state,
    login: (redirectUri?: string) => import('../../auth/auth.service').then(({ authService }) => authService.login(redirectUri)),
    logout: (redirectUri?: string) => import('../../auth/auth.service').then(({ authService }) => authService.logout(redirectUri)),
  };
}
