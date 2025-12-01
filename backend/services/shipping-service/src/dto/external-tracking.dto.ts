import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsArray, IsDateString } from 'class-validator';

export class ExternalTrackingRequestDto {
  @ApiProperty({ description: 'ID del pedido en Compras', example: 1001 })
  @IsInt()
  orderId: number;

  @ApiProperty({ description: 'Dirección de envío en texto', example: 'Av. Siempre Viva 123, Resistencia' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Lista de productos', isArray: true })
  @IsArray()
  products: any[];
}

export class ExternalTrackingResponseDto {
  @ApiProperty({ description: 'ID del tracking (puede ser numérico o string UUID)', example: 12345 })
  id: string | number;

  @ApiProperty({ description: 'Estado del tracking', example: 'created' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'ID del pedido asociado', example: 1001 })
  @IsInt()
  orderId: number;

  @ApiProperty({ description: 'Fecha de creación', example: '2023-10-26T12:00:00Z' })
  @IsDateString()
  creationDate: string;
}

