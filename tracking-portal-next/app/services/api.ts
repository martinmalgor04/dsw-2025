'use client';

import axios, { AxiosResponse } from 'axios';
import { ShipmentDetail, ApiError } from '../types/shipment';

// URL del gateway (operator-interface-service)
// Se puede configurar en build time (NEXT_PUBLIC_API_URL) o runtime
// En desarrollo local: http://localhost:3004
// En Docker: http://operator-interface-service:3004
const getApiBaseUrl = (): string => {
  // Prioridad 1: Variable de entorno de Next.js (build time)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
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
 * Usa el endpoint público que no requiere autenticación
 */
export const getShipmentDetails = async (trackingNumberOrId: string): Promise<ShipmentDetail> => {
  // El tracking portal usa un endpoint público reducido que no requiere autenticación
  const response = await apiClient.get<ShipmentDetail>(
    `/shipping/public/track/${trackingNumberOrId}`,
  );
  return response.data;
};

