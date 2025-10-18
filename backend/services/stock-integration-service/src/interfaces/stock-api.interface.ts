import { AxiosResponse } from 'axios';
import { ProductoStockDto, ReservaStockDto } from '../dto';

export interface IStockApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

export interface IStockApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

export interface IStockApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ICircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  threshold: number;
  lastFailureTime: number;
  timeSinceLastFailure: number;
}

export interface ICacheConfig {
  ttl: number;
  maxItems: number;
  store: 'memory' | 'redis';
}

export interface IStockApiClient {
  getProductById(productId: number): Promise<ProductoStockDto>;
  getReservaByCompraId(compraId: string, userId: number): Promise<ReservaStockDto | null>;
  getReservaById(reservaId: number, userId: number): Promise<ReservaStockDto | null>;
  updateReservaStatus(reservaId: number, estado: string, userId: number): Promise<ReservaStockDto>;
}

export interface IStockApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
