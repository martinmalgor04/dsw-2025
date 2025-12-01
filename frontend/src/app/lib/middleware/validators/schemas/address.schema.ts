import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().min(3, 'Calle requerida'),
  number: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^([A-Z]{1}\d{4}[A-Z]{3})$/, 'Código postal argentino inválido'),
  city: z.string().min(2, 'Ciudad requerida'),
  province: z.string().optional(),
  country: z.string().default('AR'),
});

export type Address = z.infer<typeof AddressSchema>;
