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
    dimensions: { width: number; height: number; depth?: number; length?: number };
    quantity: number;
    price?: number;
  }[];
  transportMethod?: { id: string; name: string };
  driver?: {
    id: string;
    name: string;
    phone: string;
    licenseNumber: string;
  };
  vehicle?: {
    id: string;
    licensePlate: string;
    model: string;
    capacity: number;
  };
  status: string;
  totalCost: number;
  createdAt: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
}

export interface CreateShipmentDTO {
  order_id: number;
  user_id: number;
  delivery_address: AddressDTO;
  transport_type: 'AIR' | 'SEA' | 'RAIL' | 'ROAD';
  products: ProductDTO[];
}

export type UpdateShipmentDTO = Partial<CreateShipmentDTO>;

export interface TrackingEvent {
  status: string;
  description: string;
  timestamp: string;
  location?: string;
}

export interface PublicTrackingDTO {
  id: string;
  trackingNumber?: string;
  status: string;
  statusDescription: string;
  currentLocation?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  destinationAddress: {
    city: string;
    state: string;
    postalCode: string;
  };
  transportMethod: string;
  events: TrackingEvent[];
  labelUrl?: string;
}

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

  async getShipmentById(id: string): Promise<ShipmentDTO> {
    return this.getShipment(id);
  }

  async createShipment(dto: CreateShipmentDTO): Promise<ShipmentDTO> {
    return httpClient.post('/shipping', dto);
  }

  async updateShipment(id: string, dto: UpdateShipmentDTO | { status: string }): Promise<ShipmentDTO> {
    return httpClient.patch(`/shipping/${id}`, dto);
  }

  async cancelShipment(id: string): Promise<void> {
    return httpClient.patch(`/shipping/${id}`, { status: 'CANCELLED' });
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

  async trackShipment(idOrTrackingNumber: string): Promise<PublicTrackingDTO> {
    return httpClient.get(`/shipping/track/${idOrTrackingNumber}`);
  }
}

export const shipmentService = new ShipmentService();
