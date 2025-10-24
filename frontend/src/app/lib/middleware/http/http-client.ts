import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultHttpConfig, HttpClientConfig } from './config';
import { transformAxiosError } from '../errors/error-handler';
import { authStore } from '../stores/auth.store';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpClient {
  private client: AxiosInstance;
  private config: HttpClientConfig;

  constructor(custom?: Partial<HttpClientConfig>) {
    this.config = { ...defaultHttpConfig, ...(custom || {}) } as HttpClientConfig;

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeoutMs,
      headers: this.config.defaultHeaders,
    });

    this.setupInterceptors();
  }

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

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = authStore.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        throw transformAxiosError(error);
      }
    );
  }

  private async withRetry<T>(fn: () => Promise<T>, method: string): Promise<T> {
    // Sólo retry para GET
    const isGet = method.toUpperCase() === 'GET';
    if (!isGet) return fn();

    const { maxRetries, initialDelayMs, backoffMultiplier, maxDelayMs } = this.config.retry;

    let attempt = 0;
    let delay = initialDelayMs;

    while (true) {
      try {
        return await fn();
      } catch (e: any) {
        const code = e?.code as string | undefined;
        const status = e?.statusCode as number | undefined;

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

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.patch(url, data, config);
    return res.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.delete(url, config);
    return res.data;
  }
}

export const httpClient = new HttpClient();
