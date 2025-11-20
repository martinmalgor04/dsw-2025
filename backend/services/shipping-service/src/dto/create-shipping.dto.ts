import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import { AddressDto, ProductRequestDto } from '@logistics/types';
import { TransportType } from '../enums/transport-type.enum';

export class CreateShippingRequestDto {
  @IsInt()
  @Min(1)
  order_id: number;

  @IsInt()
  @Min(1)
  user_id: number;

  @ValidateNested()
  @Type(() => AddressDto)
  delivery_address: AddressDto;

  @IsEnum(TransportType)
  transport_type: TransportType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductRequestDto)
  products: ProductRequestDto[];
}

export class CreateShippingResponseDto {
  shipping_id: string;
  status: string;
  transport_type: string;
  tracking_number?: string;
  estimated_delivery_at: string;
}
