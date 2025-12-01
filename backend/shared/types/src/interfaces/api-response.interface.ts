/**
 * Interfaz estándar para respuestas de API
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Interfaz para respuestas de error
 */
export interface ApiErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Interfaz para paginación
 */
export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

/**
 * Interfaz para respuestas paginadas
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
