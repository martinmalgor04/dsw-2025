import { envConfig } from '../../config/env.config';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface HttpClientConfig {
  baseURL: string;
  timeoutMs: number;
  defaultHeaders: Record<string, string>;
  retry: RetryConfig;
}

/**
 * Configuración única del HTTP Client
 *
 * IMPORTANTE: El frontend solo se comunica con un gateway único (Operator Interface Service)
 * que maneja el routing interno a los demás microservicios.
 * Esto reduce el acoplamiento y centraliza la comunicación.
 */
export const defaultHttpConfig: HttpClientConfig = {
  // Gateway único - obtenido de las variables de entorno
  baseURL: envConfig.apiUrl,

  // Timeout de 30 segundos
  timeoutMs: 30_000,

  // Headers comunes para todas las peticiones
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept-Language': 'es-AR',
  },

  // Configuración de reintentos automáticos (solo para GET)
  retry: {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 10_000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
};