import { AxiosError } from 'axios';
import { ApiError, ApiErrorCode } from './api-error';

export function transformAxiosError(error: unknown): ApiError {
  // Network/Unknown
  if (!isAxiosError(error)) {
    return new ApiError('UNKNOWN_ERROR', 'Error desconocido');
  }

  const err = error as AxiosError<any>;

  if (err.code === 'ECONNABORTED') {
    return new ApiError('TIMEOUT', 'Tiempo de espera agotado');
  }

  if (!err.response) {
    return new ApiError('NETWORK_ERROR', 'Error de red o servidor no disponible');
  }

  const status = err.response.status;
  const message = (err.response.data as any)?.message ?? err.message;

  const map: Record<number, ApiErrorCode> = {
    400: 'VALIDATION_ERROR',
    401: 'AUTHENTICATION_ERROR',
    403: 'AUTHORIZATION_ERROR',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'RATE_LIMIT',
  };

  const code: ApiErrorCode = map[status] ?? (status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR');

  return new ApiError(code, message, status, safeDetails(err));
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
