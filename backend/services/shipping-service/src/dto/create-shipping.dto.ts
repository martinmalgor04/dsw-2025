import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { AddressDto } from '@logistics/types';
import {
  FlexibleProductDto,
  ProductDimensionsDto,
  ShippingLocationDto,
} from './calculate-cost.dto';
import { AddressResponseDto } from './shipping-responses.dto';

export class CreateShippingProductDto extends FlexibleProductDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  override dimensions?: ProductDimensionsDto;
}

export class CreateShippingRequestDto {
  @ValidateIf((o) => o.orderId === undefined && o.orderReference === undefined)
  @IsOptional()
  @IsInt()
  @Min(1)
  order_id?: number;

  @ValidateIf((o) => o.order_reference === undefined && o.order_id === undefined)
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  order_reference?: string;

  @ValidateIf((o) => o.userId === undefined)
  @IsOptional()
  @IsInt()
  @Min(1)
  user_id?: number;

  @ValidateIf((o) => o.user_id === undefined)
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  user_reference?: string;

  @ValidateIf((o) => !o.destination)
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  delivery_address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingLocationDto)
  origin?: ShippingLocationDto;

  @ValidateIf((o) => !o.delivery_address)
  @ValidateNested()
  @Type(() => ShippingLocationDto)
  @IsOptional()
  destination?: ShippingLocationDto;

  @ValidateIf((o) => o.transport_type === undefined)
  @IsOptional()
  @IsString()
  transportType?: string;

  @ValidateIf((o) => o.transportType === undefined)
  @IsOptional()
  @IsString()
  transport_type?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateShippingProductDto)
  products: CreateShippingProductDto[];
}

import { ApiProperty } from '@nestjs/swagger';

export class CreateShippingResponseDto {
  @ApiProperty({ name: 'shipping_id' })
  shipping_id: string;

  @ApiProperty({ name: 'order_id', description: 'ID numérico de la compra que origina el envío' })
  order_id: number;

  @ApiProperty({ name: 'user_id', description: 'ID numérico del usuario' })
  user_id: number;

  status: string;

  @ApiProperty({ name: 'transport_type' })
  transport_type: string;

  @ApiProperty({ name: 'tracking_number' })
  tracking_number: string;

  @ApiProperty({ name: 'estimated_delivery_at' })
  estimated_delivery_at: string;

  @ApiProperty({ name: 'total_cost' })
  total_cost: number;

  currency: string;

  @ApiProperty({ name: 'departure_address' })
  departure_address?: AddressResponseDto;

  @ApiProperty({ name: 'delivery_address' })
  delivery_address: AddressResponseDto;
}
