import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { defaultHttpConfig, HttpClientConfig } from './config';
import { transformAxiosError } from '../errors/error-handler';
import { authStore } from '../stores/auth.store';

// ============================================================================
// UTILIDADES
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Rutas públicas que no requieren autenticación */
const PUBLIC_ROUTES = [
  '/stock/productos',
  '/stock/reservas',
  '/health',
  '/gateway/status',
  '/tracking/public',
];

/** Rutas que están en proceso de autenticación */
const AUTH_PATHS = ['/auth', '/'];

// ============================================================================
// CLIENTE HTTP
// ============================================================================

export class HttpClient {
  private client: AxiosInstance;
  private config: HttpClientConfig;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(custom?: Partial<HttpClientConfig>) {
    this.config = { ...defaultHttpConfig, ...(custom || {}) } as HttpClientConfig;

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeoutMs,
      headers: this.config.defaultHeaders,
    });

    this.setupInterceptors();
  }

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================

  setBaseUrl(url: string) {
    this.config.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  setTimeout(ms: number) {
    this.config.timeoutMs = ms;
    this.client.defaults.timeout = ms;
  }

  setHeader(name: string, value: string) {
    this.client.defaults.headers.common[name] = value;
  }

  // ==========================================================================
  // INTERCEPTORES
  // ==========================================================================

  private setupInterceptors() {
    // Request interceptor - agregar token
    this.client.interceptors.request.use(
      async (config) => this.handleRequest(config),
      (error) => Promise.reject(error)
    );

    // Response interceptor - manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => this.handleResponseError(error)
    );
  }

  private isPublicRoute(url: string | undefined): boolean {
    if (!url) return false;
    return PUBLIC_ROUTES.some(route => url.includes(route));
  }

  private async handleRequest(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    // Si es ruta pública, no agregar token
    if (this.isPublicRoute(config.url)) {
      return config;
    }

    // Obtener token directamente de localStorage (fuente de verdad)
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
    }

    // Agregar token al header si existe
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.debug('🔑 Token agregado a request:', config.url?.substring(0, 50));
    } else if (!this.isPublicRoute(config.url)) {
      console.warn('⚠️ Request sin token:', config.url);
    }

    return config;
  }

  private async handleResponseError(error: unknown): Promise<never> {
    const axiosError = error as { response?: { status: number }; config?: InternalAxiosRequestConfig };
    
    // Si es error 401 y estamos en el browser
    if (axiosError.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // No manejar 401 si ya estamos en login/callback
      if (AUTH_PATHS.some(path => currentPath.startsWith(path) || currentPath === path)) {
        throw transformAxiosError(error);
      }

      // Intentar refresh del token
      const newToken = await this.attemptTokenRefresh();
      
      if (newToken && axiosError.config) {
        // Reintentar request con nuevo token
        console.log('🔄 Reintentando request con token refrescado...');
        axiosError.config.headers.Authorization = `Bearer ${newToken}`;
        return this.client.request(axiosError.config) as never;
      }

      // Si no se pudo refrescar, redirigir al login
      console.warn('⚠️ Sesión expirada, redirigiendo al login...');
      this.clearAuthAndRedirect();
    }

    throw transformAxiosError(error);
  }

  private async getTokenFromKeycloak(): Promise<string | null> {
    try {
      const { getKeycloak } = await import('../auth/keycloak.config');
      const keycloak = getKeycloak();
      
      if (keycloak?.authenticated && keycloak.token) {
        authStore.setToken(keycloak.token);
        return keycloak.token;
      }
    } catch {
      // Keycloak no disponible
    }
    return null;
  }

  private async attemptTokenRefresh(): Promise<string | null> {
    // Si ya estamos refrescando, esperar
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const { getKeycloak } = await import('../auth/keycloak.config');
      const keycloak = getKeycloak();

      if (!keycloak) {
        return null;
      }

      const refreshed = await keycloak.updateToken(30);
      
      if (refreshed && keycloak.token) {
        console.log('✅ Token refrescado exitosamente');
        authStore.setToken(keycloak.token);
        
        // Notificar a todos los subscribers
        this.refreshSubscribers.forEach(callback => callback(keycloak.token!));
        this.refreshSubscribers = [];
        
        return keycloak.token;
      }

      // Si no hay sesión activa
      if (!keycloak.authenticated) {
        return null;
      }

      return keycloak.token || null;
    } catch (error) {
      console.warn('❌ Error refrescando token:', error);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private clearAuthAndRedirect(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    authStore.setToken(null);
    window.location.href = '/';
  }

  // ==========================================================================
  // RETRY LOGIC
  // ==========================================================================

  private async withRetry<T>(fn: () => Promise<T>, method: string): Promise<T> {
    // Solo retry para GET
    if (method.toUpperCase() !== 'GET') return fn();

    const { maxRetries, initialDelayMs, backoffMultiplier, maxDelayMs } = this.config.retry;
    let attempt = 0;
    let delay = initialDelayMs;

    while (true) {
      try {
        return await fn();
      } catch (e: unknown) {
        const error = e as { code?: string; statusCode?: number };
        const code = error.code;
        const status = error.statusCode;

        const retryable =
          code === 'NETWORK_ERROR' ||
          code === 'TIMEOUT' ||
          (status !== undefined && this.config.retry.retryableStatusCodes.includes(status));

        if (!retryable || attempt >= maxRetries) throw e;

        await sleep(Math.min(delay, maxDelayMs));
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
        attempt += 1;
      }
    }
  }

  // ==========================================================================
  // MÉTODOS HTTP
  // ==========================================================================

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const exec = async () => {
      const res: AxiosResponse<T> = await this.client.get(url, config);
      return res.data;
    };
    return this.withRetry(exec, 'GET');
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.post(url, data, config);
    return res.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.put(url, data, config);
    return res.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.patch(url, data, config);
    return res.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.delete(url, config);
    return res.data;
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

export const httpClient = new HttpClient();
