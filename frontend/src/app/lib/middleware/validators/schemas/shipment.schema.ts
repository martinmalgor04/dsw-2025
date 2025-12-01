import { z } from 'zod';
import { AddressSchema } from './address.schema';

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  weight: z.number().positive('Peso debe ser positivo'),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

export const CreateShipmentSchema = z.object({
  orderId: z.number().positive('Debe ser un número positivo'),
  originAddress: AddressSchema,
  destinationAddress: AddressSchema,
  products: z.array(ProductSchema).min(1, 'Al menos un producto'),
  transportMethod: z.string().uuid('Método de transporte inválido'),
  estimatedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
});

export const QuoteRequestSchema = z.object({
  weight: z.number().positive(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  transportMethod: z.string().uuid(),
  originZone: z.string(),
  destinationZone: z.string(),
  urgency: z.enum(['NORMAL', 'EXPRESS']).optional(),
});
