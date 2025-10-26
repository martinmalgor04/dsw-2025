import { Injectable, Logger } from '@nestjs/common';

export interface LogContext {
  userId?: number;
  requestId?: string;
  service?: string;
  operation?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService extends Logger {
  constructor(context?: string) {
    super(context || 'LoggerService');
  }

  /**
   * Log con contexto estructurado
   */
  logWithContext(
    message: string,
    context: LogContext,
    logLevel: 'log' | 'error' | 'warn' | 'debug' = 'log',
  ) {
    const contextString =
      Object.keys(context).length > 0 ? JSON.stringify(context) : '';
    const fullMessage = contextString
      ? `${message} - Context: ${contextString}`
      : message;

    this[logLevel](fullMessage);
  }

  /**
   * Log de inicio de operación
   */
  startOperation(operation: string, context: LogContext = {}) {
    this.logWithContext(
      `Starting operation: ${operation}`,
      {
        ...context,
        operation,
        timestamp: new Date().toISOString(),
      },
      'log',
    );
  }

  /**
   * Log de finalización de operación
   */
  endOperation(operation: string, context: LogContext = {}, duration?: number) {
    this.logWithContext(
      `Completed operation: ${operation}`,
      {
        ...context,
        operation,
        duration: duration ? `${duration}ms` : undefined,
        timestamp: new Date().toISOString(),
      },
      'log',
    );
  }

  /**
   * Log de error con contexto
   */
  errorWithContext(message: string, error: Error, context: LogContext = {}) {
    this.logWithContext(
      `Error: ${message}`,
      {
        ...context,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      'error',
    );
  }

  /**
   * Log de API calls externos
   */
  apiCall(method: string, url: string, context: LogContext = {}) {
    this.logWithContext(
      `API Call: ${method} ${url}`,
      {
        ...context,
        method,
        url,
        timestamp: new Date().toISOString(),
      },
      'log',
    );
  }

  /**
   * Log de respuesta de API
   */
  apiResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {},
  ) {
    this.logWithContext(
      `API Response: ${method} ${url} - ${statusCode}`,
      {
        ...context,
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      statusCode >= 400 ? 'error' : 'log',
    );
  }
}
