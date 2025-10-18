import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoggerService } from '../logger/logger.service';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

@Injectable()
export class HttpClientService {
  private client: AxiosInstance;
  private readonly logger = new LoggerService(HttpClientService.name);

  constructor(private config: HttpClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 5000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).metadata = { startTime };
        
        this.logger.apiCall(
          config.method?.toUpperCase() || 'GET',
          `${config.baseURL || ''}${config.url}`,
          { service: 'HttpClientService' }
        );

        return config;
      },
      (error) => {
        this.logger.errorWithContext('Request failed', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
        
        this.logger.apiResponse(
          response.config.method?.toUpperCase() || 'GET',
          `${response.config.baseURL || ''}${response.config.url}`,
          response.status,
          duration,
          { service: 'HttpClientService' }
        );

        return response;
      },
      (error) => {
        if (error.response) {
          const duration = Date.now() - ((error.config as any)?.metadata?.startTime || 0);
          
          this.logger.apiResponse(
            error.config?.method?.toUpperCase() || 'GET',
            `${error.config?.baseURL || ''}${error.config?.url}`,
            error.response.status,
            duration,
            { service: 'HttpClientService' }
          );
        } else {
          this.logger.errorWithContext('Network error', error);
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.get<T>(url, config));
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.post<T>(url, data, config));
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.put<T>(url, data, config));
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.patch<T>(url, data, config));
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.delete<T>(url, config));
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const maxRetries = this.config.retries || 3;
    const retryDelay = this.config.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Solo reintentar en casos específicos
        const shouldRetry = this.shouldRetry(error);
        if (!shouldRetry) {
          throw error;
        }

        this.logger.logWithContext(
          `Retrying request, attempt ${attempt}/${maxRetries}`,
          { attempt, maxRetries, delay: retryDelay }
        );

        await this.delay(retryDelay * Math.pow(2, attempt - 1)); // Exponential backoff
      }
    }

    throw new Error('Max retries exceeded');
  }

  private shouldRetry(error: any): boolean {
    // Reintentar en casos de errores de red o errores 5xx
    return (
      !error.response || 
      error.response.status >= 500 || 
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configurar headers de autenticación
   */
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remover headers de autenticación
   */
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }
}