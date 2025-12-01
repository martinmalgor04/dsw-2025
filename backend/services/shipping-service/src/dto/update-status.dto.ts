import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ShippingStatus {
  CREATED = 'CREATED',
  RESERVED = 'RESERVED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  IN_DISTRIBUTION = 'IN_DISTRIBUTION',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export class UpdateShippingStatusDto {
  @ApiProperty({ enum: ShippingStatus, description: 'Nuevo estado del envío' })
  @IsEnum(ShippingStatus)
  status: string;

  @ApiProperty({ description: 'Mensaje o motivo del cambio de estado', required: false })
  @IsString()
  @IsOptional()
  message?: string;
}

