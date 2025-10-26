export class ProductQtyDto {
  product_id: number;
  quantity: number;
}

export class ShippingLogDto {
  timestamp: string;
  status: string;
  message: string;
}

export class AddressResponseDto {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export class ShippingDetailDto {
  shipping_id: string;
  order_id: number;
  user_id: number;
  delivery_address: AddressResponseDto;
  departure_address?: AddressResponseDto;
  products: ProductQtyDto[];
  status: string;
  transport_type: string;
  tracking_number?: string;
  carrier_name?: string;
  total_cost: number;
  currency: string;
  estimated_delivery_at: string;
  created_at: string;
  updated_at: string;
  logs: ShippingLogDto[];
}

export class ShippingSummaryDto {
  shipping_id: string;
  order_id: number;
  user_id: number;
  products: ProductQtyDto[];
  status: string;
  transport_type: string;
  estimated_delivery_at: string;
  created_at: string;
}

export class PaginationMetaDto {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

export class ListShippingResponseDto {
  shipments: ShippingSummaryDto[];
  pagination: PaginationMetaDto;
}

export class CancelShippingResponseDto {
  shipping_id: string;
  status: string;
  cancelled_at: string;
}
