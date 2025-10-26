import { Type } from 'class-transformer';
import { ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { AddressDto, ProductRequestDto } from '@logistics/types';

export class CalculateCostRequestDto {
  @ValidateNested()
  @Type(() => AddressDto)
  delivery_address: AddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductRequestDto)
  products: ProductRequestDto[];
}

export class ProductCostDto {
  id: number;
  cost: number;
}

export class CostBreakdownDto {
  products_cost: number;
  shipping_cost: number;
  distance_km: number;
  weight_kg: number;
}

export class CalculateCostResponseDto {
  currency: string;
  total_cost: number;
  transport_type: string;
  products: ProductCostDto[];
  breakdown?: CostBreakdownDto;
}
