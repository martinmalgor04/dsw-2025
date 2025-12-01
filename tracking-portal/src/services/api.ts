import axios, { AxiosResponse } from 'axios';
import { ShipmentDetail, ApiError } from '../types/shipment';

// URL del gateway (operator-interface-service)
// Se puede configurar en build time (VITE_API_URL) o runtime (window.__API_URL__)
// En desarrollo local: http://localhost:3004
// En Docker: http://operator-interface-service:3004
const getApiBaseUrl = (): string => {
  // Prioridad 1: Variable global inyectada en runtime (para Docker)
  if (typeof window !== 'undefined' && (window as any).__API_URL__) {
    return (window as any).__API_URL__;
  }
  // Prioridad 2: Variable de entorno de Vite (build time)
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  // Fallback: localhost para desarrollo
  return 'http://localhost:3004';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      // Error de respuesta del servidor
      const apiError: ApiError = {
        code: error.response.data?.code || 'server_error',
        message: error.response.data?.message || 'Error interno del servidor',
        details: error.response.data?.details
      };
      throw apiError;
    } else if (error.request) {
      // Error de red
      throw {
        code: 'network_error',
        message: 'Error de conexión. Verifica tu conexión a internet.',
      } as ApiError;
    } else {
      // Otro tipo de error
      throw {
        code: 'unknown_error',
        message: 'Ha ocurrido un error inesperado.',
      } as ApiError;
    }
  }
);

/**
 * Busca un envío por tracking number o ID
 * Primero intenta buscar por tracking number, si falla intenta por ID
 */
export const getShipmentDetails = async (trackingNumberOrId: string): Promise<ShipmentDetail> => {
  // El tracking portal usa un endpoint público reducido que no requiere autenticación
  const response = await apiClient.get<ShipmentDetail>(
    `/shipping/public/track/${trackingNumberOrId}`,
  );
  return response.data;
};

export interface ShipmentListItem {
  shipping_id: number;
  order_id: string;
  user_id: string;
  products: Array<{
    product_id: number;
    quantity: number;
    reference?: string;
  }>;
  status: string;
  transport_type: string;
  estimated_delivery_at: string;
  created_at: string;
}

export interface ShipmentListResponse {
  shipments: ShipmentListItem[];
  total: number;
  page: number;
  limit: number;
}

export const getShipmentsList = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ShipmentListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const url = `/shipping${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiClient.get<ShipmentListResponse>(url);
  return response.data;
};
