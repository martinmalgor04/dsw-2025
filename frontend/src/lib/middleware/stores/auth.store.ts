import { authService } from '../auth/auth.service';

export interface AuthUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roles?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

let state: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const subscribers: Array<(s: AuthState) => void> = [];

function notify() {
  for (const sub of subscribers) sub(state);
}

export const authStore = {
  subscribe(fn: (s: AuthState) => void) {
    subscribers.push(fn);
    fn(state);
    return () => {
      const i = subscribers.indexOf(fn);
      if (i >= 0) subscribers.splice(i, 1);
    };
  },
  setUser(user: AuthUser | null) {
    state = { ...state, user, isAuthenticated: !!user };
    notify();
  },
  setToken(token: string | null) {
    state = { ...state, token, isAuthenticated: !!token };
    try {
      if (token) localStorage.setItem('auth_token', token);
      else localStorage.removeItem('auth_token');
    } catch {}
    notify();
  },
  setLoading(isLoading: boolean) {
    state = { ...state, isLoading };
    notify();
  },
  setError(error: string | null) {
    state = { ...state, error };
    notify();
  },
  async init() {
    this.setLoading(true);
    await authService.init();
    const token = localStorage.getItem('auth_token');
    this.setToken(token);
    this.setLoading(false);
  },
  getToken(): string | null {
    return state.token;
  },
};
