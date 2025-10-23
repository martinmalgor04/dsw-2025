import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { serviceConfigs } from './config';

// Cliente HTTP específico para Config Service
class ConfigHttpClient {
  private client: AxiosInstance;

  constructor() {
    const config = serviceConfigs.config;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeoutMs,
      headers: config.defaultHeaders,
    });

    // Interceptor de request
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Config Service] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Config Service] Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de response
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[Config Service] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[Config Service] Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Instancia singleton del cliente
export const configHttpClient = new ConfigHttpClient();
