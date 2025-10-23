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

export const defaultHttpConfig: HttpClientConfig = {
  baseURL: (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:3003',
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
};
