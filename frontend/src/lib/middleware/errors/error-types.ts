import { ApiError, ApiErrorCode } from './api-error';

export class ValidationError extends ApiError {
  constructor(message = 'Los datos enviados son inválidos', details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'No autenticado', details?: Record<string, unknown>) {
    super('AUTHENTICATION_ERROR', message, 401, details);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'No autorizado', details?: Record<string, unknown>) {
    super('AUTHORIZATION_ERROR', message, 403, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Recurso no encontrado', details?: Record<string, unknown>) {
    super('NOT_FOUND', message, 404, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflicto de recursos', details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Demasiadas solicitudes', details?: Record<string, unknown>) {
    super('RATE_LIMIT', message, 429, details);
  }
}

export class ServerError extends ApiError {
  constructor(message = 'Error interno del servidor', details?: Record<string, unknown>) {
    super('SERVER_ERROR', message, 500, details);
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Error de red', details?: Record<string, unknown>) {
    super('NETWORK_ERROR', message, undefined, details);
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'Tiempo de espera agotado', details?: Record<string, unknown>) {
    super('TIMEOUT', message, undefined, details);
  }
}

export class UnknownError extends ApiError {
  constructor(message = 'Error desconocido', details?: Record<string, unknown>) {
    super('UNKNOWN_ERROR', message, undefined, details);
  }
}
