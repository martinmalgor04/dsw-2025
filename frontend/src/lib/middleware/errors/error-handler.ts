import { AxiosError } from 'axios';
import { ApiError } from './api-error';
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
  UnknownError,
  ValidationError,
} from './error-types';

export function transformAxiosError(error: unknown): ApiError {
  // Network/Unknown
  if (!isAxiosError(error)) {
    return new UnknownError('Error desconocido');
  }

  const err = error as AxiosError<any>;

  if (err.code === 'ECONNABORTED') {
    return new TimeoutError('Tiempo de espera agotado');
  }

  if (!err.response) {
    return new NetworkError('Error de red o servidor no disponible');
  }

  const status = err.response.status;
  const message = (err.response.data as any)?.message ?? err.message;
  const details = safeDetails(err);

  switch (status) {
    case 400:
      return new ValidationError(message, details);
    case 401:
      return new AuthenticationError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 409:
      return new ConflictError(message, details);
    case 429:
      return new RateLimitError(message, details);
    default:
      if (status >= 500) {
        return new ServerError(message, details);
      }
      return new UnknownError(message, details);
  }
}

function isAxiosError(error: unknown): error is AxiosError {
  return !!(error as any)?.isAxiosError;
}

function safeDetails(err: AxiosError): Record<string, unknown> {
  return {
    url: err.config?.url,
    method: err.config?.method,
    status: err.response?.status,
    responseData: redact(err.response?.data),
  };
}

function redact(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return undefined;
  }
}
