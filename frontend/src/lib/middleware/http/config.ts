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

// Configuración para cada microservicio
export const serviceConfigs = {
  // Operator Interface Service (Gateway principal)
  operator: {
    baseURL: (import.meta as any)?.env?.VITE_OPERATOR_URL || 'http://localhost:3004',
    timeoutMs: 30_000,
    defaultHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'es-AR',
    },
    retry: {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 10_000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  },
  
  // Config Service (Puerto 3003)
  config: {
    baseURL: (import.meta as any)?.env?.VITE_CONFIG_URL || 'http://localhost:3003',
    timeoutMs: 30_000,
    defaultHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'es-AR',
    },
    retry: {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 10_000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  },
  
  // Shipping Service (Puerto 3001)
  shipping: {
    baseURL: (import.meta as any)?.env?.VITE_SHIPPING_URL || 'http://localhost:3001',
    timeoutMs: 30_000,
    defaultHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'es-AR',
    },
    retry: {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 10_000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  },
  
  // Stock Integration Service (Puerto 3002)
  stock: {
    baseURL: (import.meta as any)?.env?.VITE_STOCK_URL || 'http://localhost:3002',
    timeoutMs: 30_000,
    defaultHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'es-AR',
    },
    retry: {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 10_000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  },
};

// Configuración por defecto (para compatibilidad)
export const defaultHttpConfig: HttpClientConfig = serviceConfigs.operator;