/**
 * Interfaz para health checks de servicios
 */
export interface ServiceHealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  dependencies?: DependencyHealth[];
}

/**
 * Interfaz para health check de dependencias
 */
export interface DependencyHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}
