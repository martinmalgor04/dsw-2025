import { httpClient } from '../http/http-client';

export interface StockProduct {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stockDisponible: number;
  pesoKg: number;
  dimensiones: {
    largoCm: number;
    anchoCm: number;
    altoCm: number;
  };
  ubicacion: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  imagenes?: Array<{
    url: string;
    esPrincipal?: number;
  }>;
  categorias?: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
}

export interface StockReservaProducto {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  dimensiones?: {
    largoCm: number;
    anchoCm: number;
    altoCm: number;
  };
}

export type StockReservaEstado = 'confirmado' | 'pendiente' | 'cancelado';

export interface StockReserva {
  idReserva: number;
  idCompra: string;
  usuarioId: number;
  estado: StockReservaEstado;
  expiresAt?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  productos: StockReservaProducto[];
}

export interface ListReservasParams {
  usuarioId?: number;
  estado?: StockReservaEstado;
  idCompra?: string;
}

const buildQuery = (params?: Record<string, string | number | undefined>) => {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const stockService = {
  async listProducts(): Promise<StockProduct[]> {
    return httpClient.get('/stock/productos');
  },

  async listReservas(params?: ListReservasParams): Promise<StockReserva[]> {
    const query = buildQuery({
      usuarioId: params?.usuarioId,
      estado: params?.estado,
      idCompra: params?.idCompra,
    });
    return httpClient.get(`/stock/reservas${query}`);
  },

  async updateReservaEstado(
    reservaId: number,
    usuarioId: number,
    estado: StockReservaEstado,
  ): Promise<StockReserva> {
    const query = buildQuery({ usuarioId });
    return httpClient.patch(`/stock/reservas/${reservaId}${query}`, {
      estado,
    });
  },

  async cancelReserva(
    reservaId: number,
    motivo: string,
  ): Promise<void> {
    await httpClient.delete(`/stock/reservas/${reservaId}`, {
      data: { motivo },
    });
  },
};

export type StockService = typeof stockService;

