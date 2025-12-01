// Tipos basados en el OpenAPI schema para ShippingDetail
export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ProductQuantity {
  product_id: number;
  quantity: number;
}

export interface ShippingLog {
  timestamp: string;
  status: string;
  message: string;
}

export type ShippingStatus =
  | 'created'
  | 'reserved'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'in_distribution'
  | 'arrived';

export type TransportType = 'air' | 'sea' | 'rail' | 'road';

export interface ShipmentDetail {
  shipping_id: number;
  order_id: number;
  user_id: number;
  delivery_address: Address;
  departure_address: Address;
  products: ProductQuantity[];
  status: ShippingStatus;
  transport_type: TransportType;
  tracking_number?: string;
  carrier_name?: string;
  total_cost?: number;
  currency?: string;
  estimated_delivery_at: string;
  created_at: string;
  updated_at: string;
  logs: ShippingLog[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

