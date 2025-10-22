import { keycloak, keycloakInitOptions } from './keycloak.config';

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) AuthService.instance = new AuthService();
    return AuthService.instance;
  }

  async init(): Promise<boolean> {
    try {
      const authenticated = await keycloak.init(keycloakInitOptions);
      if (authenticated && keycloak.token) {
        localStorage.setItem('auth_token', keycloak.token);
      }
      return authenticated;
    } catch {
      return false;
    }
  }

  async login(redirectUri?: string): Promise<void> {
    await keycloak.login({ redirectUri: redirectUri || window.location.origin });
  }

  async logout(redirectUri?: string): Promise<void> {
    localStorage.removeItem('auth_token');
    await keycloak.logout({ redirectUri: redirectUri || window.location.origin });
  }

  getToken(): string | undefined {
    return keycloak.token || undefined;
  }

  async refreshToken(minValidity = 60): Promise<boolean> {
    try {
      const refreshed = await keycloak.updateToken(minValidity);
      if (refreshed && keycloak.token) localStorage.setItem('auth_token', keycloak.token);
      return refreshed;
    } catch {
      await this.logout();
      return false;
    }
  }
}

export const authService = AuthService.getInstance();
