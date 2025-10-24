import { httpClient } from '../http/http-client';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  service: string;
  version?: string;
  environment?: string;
}

export interface ServiceStatus {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
}

class HealthService {
  async checkHealth(): Promise<HealthStatus> {
    return httpClient.get('/health');
  }

  async getServiceStatus(name: string): Promise<ServiceStatus> {
    return httpClient.get(`/health/services/${name}`);
  }

  async getPingLatency(): Promise<number> {
    const start = performance.now();
    await this.checkHealth();
    const end = performance.now();
    return Math.round(end - start);
  }
}

export const healthService = new HealthService();
