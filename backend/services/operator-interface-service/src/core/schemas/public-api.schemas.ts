import { ApiProperty } from '@nestjs/swagger';

// ==========================================
// COMMON
// ==========================================

export class AddressSchema {
  @ApiProperty({ example: 'Av. Siempreviva 123' })
  street: string;

  @ApiProperty({ example: 'Springfield' })
  city: string;

  @ApiProperty({ example: 'Estado' })
  state: string;

  @ApiProperty({ example: '12345' })
  postal_code: string;

  @ApiProperty({ example: 'US' })
  country: string;
}

export class ProductRequestSchema {
  @ApiProperty({ example: 1, description: 'ID del producto en Stock' })
  id: number;

  @ApiProperty({ example: 5, description: 'Cantidad requerida' })
  quantity: number;
}

// ==========================================
// SHIPPING
// ==========================================

export class CreateShippingRequestSchema {
  @ApiProperty({ example: 1001, description: 'ID de la orden externa' })
  order_id: number;

  @ApiProperty({ example: 500, description: 'ID del usuario cliente' })
  user_id: number;

  @ApiProperty()
  delivery_address: AddressSchema;

  @ApiProperty({ example: 'road', enum: ['road', 'air', 'sea', 'rail'] })
  transport_type: string;

  @ApiProperty({ type: [ProductRequestSchema] })
  products: ProductRequestSchema[];
}

export class ShippingDetailSchema {
  @ApiProperty({ example: 'a0eebc99-9c0b...' })
  shipping_id: string;

  @ApiProperty({ example: '1001' })
  order_id: string;

  @ApiProperty({ example: 'created', enum: ['created', 'in_transit', 'delivered', 'cancelled'] })
  status: string;

  @ApiProperty()
  tracking_number: string;

  @ApiProperty({ example: 1500.50 })
  total_cost: number;

  @ApiProperty({ example: '2025-12-01T10:00:00Z' })
  estimated_delivery_at: string;

  @ApiProperty()
  delivery_address: AddressSchema;
  
  @ApiProperty()
  departure_address: AddressSchema;
}

// ==========================================
// CONFIG & FLEET
// ==========================================

export class TransportMethodSchema {
  @ApiProperty({ example: 'road' })
  code: string;

  @ApiProperty({ example: 'Transporte Terrestre' })
  name: string;

  @ApiProperty({ example: 60, description: 'Velocidad promedio km/h' })
  average_speed: number;
}

export class RouteSchema {
  @ApiProperty({ example: 'b1eebc99-...' })
  id: string;

  @ApiProperty({ example: 'Ruta Norte - Matutina' })
  name: string;

  @ApiProperty({ example: 'planned' })
  status: string;

  @ApiProperty({ example: '2025-12-01T08:00:00Z' })
  start_date: string;

  @ApiProperty()
  vehicle_id: string;

  @ApiProperty()
  driver_id: string;
}

