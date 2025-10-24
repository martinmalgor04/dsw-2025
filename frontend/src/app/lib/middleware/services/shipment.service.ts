import { httpClient } from '../http/http-client';

export interface ShipmentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  originZone?: string;
  destinationZone?: string;
  transportMethodId?: string;
}

export interface AddressDTO {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ProductDTO {
  id: number;
  quantity: number;
}

export interface ShipmentDTO {
  id: string;
  orderId: number;
  originAddress: AddressDTO;
  destinationAddress: AddressDTO;
  products: {
    id: string;
    name: string;
    weight: number;
    dimensions: { width: number; height: number; depth: number };
    quantity: number;
    price: number;
  }[];
  transportMethod?: { id: string; name: string };
  status: string;
  totalCost: number;
  createdAt: string;
  estimatedDeliveryDate?: string;
}

export interface CreateShipmentDTO {
  order_id: number;
  user_id: number;
  delivery_address: AddressDTO;
  transport_type: 'AIR' | 'SEA' | 'RAIL' | 'ROAD';
  products: ProductDTO[];
}

export interface UpdateShipmentDTO extends Partial<CreateShipmentDTO> {}

// DTO para la respuesta del cálculo de costo, alineado con el backend
export interface CalculateCostResponseDTO {
  currency: string;
  total_cost: number;
  transport_type: string;
  products: { id: number; cost: number }[];
  breakdown?: {
    products_cost: number;
    shipping_cost: number;
    distance_km: number;
    weight_kg: number;
  };
}

class ShipmentService {
  async getShipments(filters?: ShipmentFilters): Promise<ShipmentDTO[]> {
    return httpClient.get('/shipping', { params: filters });
  }

  async getShipment(id: string): Promise<ShipmentDTO> {
    return httpClient.get(`/shipping/${id}`);
  }

  async createShipment(dto: CreateShipmentDTO): Promise<ShipmentDTO> {
    return httpClient.post('/shipping', dto);
  }

  async updateShipment(id: string, dto: UpdateShipmentDTO): Promise<ShipmentDTO> {
    return httpClient.patch(`/shipping/${id}`, dto);
  }

  async deleteShipment(id: string): Promise<void> {
    return httpClient.delete(`/shipping/${id}`);
  }

  async calculateQuote(
    delivery_address: AddressDTO,
    products: ProductDTO[]
  ): Promise<CalculateCostResponseDTO> {
    return httpClient.post('/shipping/cost', { delivery_address, products });
  }
}

export const shipmentService = new ShipmentService();
