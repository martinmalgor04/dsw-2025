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
  number?: string;
  postalCode: string;
  city: string;
  province?: string;
  country: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  quantity: number;
  price: number;
}

export interface ShipmentDTO {
  id: string;
  orderId: number;
  originAddress: AddressDTO;
  destinationAddress: AddressDTO;
  products: ProductDTO[];
  transportMethod?: { id: string; name: string };
  status: string;
  totalCost: number;
  createdAt: string;
  estimatedDeliveryDate?: string;
}

export interface CreateShipmentDTO {
  orderId: number;
  originAddress: AddressDTO;
  destinationAddress: AddressDTO;
  products: ProductDTO[];
  transportMethod: string; // id
  estimatedDeliveryDate?: string;
  notes?: string;
}

export interface UpdateShipmentDTO extends Partial<CreateShipmentDTO> {}

export interface QuoteRequestDTO {
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  transportMethod: string; // id
  originZone: string;
  destinationZone: string;
  urgency?: 'NORMAL' | 'EXPRESS';
}

export interface QuoteResponseDTO {
  baseCost: number;
  taxes: number;
  total: number;
  estimatedDays: string;
}

class ShipmentService {
  async getShipments(filters?: ShipmentFilters): Promise<ShipmentDTO[]> {
    return httpClient.get('/shipments', { params: filters });
  }

  async getShipment(id: string): Promise<ShipmentDTO> {
    return httpClient.get(`/shipments/${id}`);
  }

  async createShipment(dto: CreateShipmentDTO): Promise<ShipmentDTO> {
    return httpClient.post('/shipments', dto);
  }

  async updateShipment(id: string, dto: UpdateShipmentDTO): Promise<ShipmentDTO> {
    return httpClient.patch(`/shipments/${id}`, dto);
  }

  async deleteShipment(id: string): Promise<void> {
    return httpClient.delete(`/shipments/${id}`);
  }

  async calculateQuote(dto: QuoteRequestDTO): Promise<QuoteResponseDTO> {
    return httpClient.post('/shipments/quote/calculate', dto);
  }
}

export const shipmentService = new ShipmentService();
