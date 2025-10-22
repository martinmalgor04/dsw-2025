import type { InternalAxiosRequestConfig } from 'axios';

// Placeholder para integración con auth store/keycloak
function getToken(): string | undefined {
  try {
    const token = localStorage.getItem('auth_token');
    return token || undefined;
  } catch {
    return undefined;
  }
}

export function attachRequestMetadata(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const headers = config.headers ?? {};

  // JWT
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Idioma y UA
  headers['Accept-Language'] = headers['Accept-Language'] || 'es-AR';
  headers['X-Requested-With'] = headers['X-Requested-With'] || 'XMLHttpRequest';

  config.headers = headers;
  return config;
}
