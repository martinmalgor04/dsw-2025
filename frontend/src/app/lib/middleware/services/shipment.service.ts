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
  orderId: number; // ID numérico de la compra que origina el envío
  userId?: number;
  orderReference?: string;
  trackingNumber?: string;
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
  logs?: Array<{ timestamp: string; status: string; message: string }>;
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

// Tipo para la respuesta del API (snake_case) - tanto para lista como detalle
interface ApiShippingSummary {
  shipping_id: string;
  order_id: number; // ID numérico de la compra que origina el envío
  user_id: number; // ID numérico del usuario
  order_reference?: string;
  user_reference?: string;
  status: string;
  transport_type: string;
  estimated_delivery_at: string;
  created_at: string;
  updated_at?: string;
  products: Array<{ product_id: number; quantity: number; reference?: string }>;
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  departure_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  tracking_number?: string;
  carrier_name?: string;
  total_cost?: number;
  currency?: string;
  cancelled_at?: string;
  logs?: Array<{ timestamp: string; status: string; message: string }>;
}

interface ApiListShippingResponse {
  shipments: ApiShippingSummary[];
  total: number;
  page: number;
  limit: number;
}

// Función para mapear de snake_case (API) a camelCase (Frontend)
function mapApiShippingToDTO(api: ApiShippingSummary): ShipmentDTO {
  // Helper para crear una dirección por defecto
  const createDefaultAddress = () => ({
    street: 'No especificada',
    city: 'No especificada',
    state: 'No especificada',
    postal_code: 'N/A',
    country: 'N/A',
  });

  // Mapear dirección de origen (departure_address)
  const originAddress = api.departure_address ? {
    street: api.departure_address.street || 'No especificada',
    city: api.departure_address.city || 'No especificada',
    state: api.departure_address.state || 'No especificada',
    postal_code: api.departure_address.postal_code || 'N/A',
    country: api.departure_address.country || 'N/A',
  } : createDefaultAddress();

  // Mapear dirección de destino (delivery_address) - siempre debe existir
  const destinationAddress = api.delivery_address ? {
    street: api.delivery_address.street || 'No especificada',
    city: api.delivery_address.city || 'No especificada',
    state: api.delivery_address.state || 'No especificada',
    postal_code: api.delivery_address.postal_code || 'N/A',
    country: api.delivery_address.country || 'N/A',
  } : createDefaultAddress();

  // Mapear orderId y userId - ambos vienen como número desde el backend
  const orderId: number =
    typeof api.order_id === 'number' && !isNaN(api.order_id) ? api.order_id : 0;

  const userId: number =
    typeof api.user_id === 'number' && !isNaN(api.user_id) ? api.user_id : 0;

  // Mapear transport_type a transportMethod
  const transportTypeMap: Record<string, { id: string; name: string }> = {
    'AIR': { id: 'air', name: 'Aéreo' },
    'SEA': { id: 'sea', name: 'Marítimo' },
    'RAIL': { id: 'rail', name: 'Ferroviario' },
    'ROAD': { id: 'road', name: 'Terrestre' },
  };
  const transportMethod = api.transport_type 
    ? transportTypeMap[api.transport_type] || { id: api.transport_type.toLowerCase(), name: api.transport_type }
    : undefined;

  return {
    id: api.shipping_id,
    orderId,
    userId,
    orderReference: api.order_reference,
    trackingNumber: api.tracking_number || undefined,
    originAddress,
    destinationAddress,
    products: (api.products || []).map(p => ({
      id: `product-${p.product_id}`,
      name: `Product ${p.product_id}`,
      weight: 0,
      dimensions: { width: 0, height: 0 },
      quantity: p.quantity || 0,
    })),
    transportMethod,
    status: api.status || 'UNKNOWN',
    totalCost: api.total_cost || 0,
    createdAt: api.created_at || new Date().toISOString(),
    estimatedDeliveryDate: api.estimated_delivery_at,
    actualDeliveryDate: undefined,
    logs: api.logs,
  };
}

class ShipmentService {
  async getShipments(filters?: ShipmentFilters): Promise<ShipmentDTO[]> {
    try {
      const response = await httpClient.get<ApiListShippingResponse | ShipmentDTO[]>('/shipping', { params: filters });
      
      // El API devuelve { shipments: [...], total, page, limit }
      if (response && typeof response === 'object' && 'shipments' in response && Array.isArray(response.shipments)) {
        // Mapear cada shipment de snake_case a camelCase
        return response.shipments.map(mapApiShippingToDTO);
      }
      
      // Si ya es un array (formato legacy o mock), devolverlo directamente
      if (Array.isArray(response)) {
        return response;
      }
      
      // Fallback: si no hay estructura esperada, devolver array vacío
      console.warn('Unexpected response format from /shipping:', response);
      return [];
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw error;
    }
  }

  async getShipment(id: string): Promise<ShipmentDTO> {
    try {
      const response = await httpClient.get<ApiShippingSummary | ShipmentDTO>(`/shipping/${id}`);
      
      // Si ya es un ShipmentDTO (formato legacy), devolverlo directamente
      if (response && typeof response === 'object' && 'id' in response && 'orderId' in response) {
        return response as ShipmentDTO;
      }
      
      // Si es formato API (snake_case), mapearlo
      if (response && typeof response === 'object' && 'shipping_id' in response) {
        return mapApiShippingToDTO(response as ApiShippingSummary);
      }
      
      // Fallback: devolver un objeto básico
      console.warn('Unexpected response format from /shipping/:id:', response);
      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Error fetching shipment:', error);
      throw error;
    }
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
