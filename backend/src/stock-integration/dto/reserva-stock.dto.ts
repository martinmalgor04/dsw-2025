import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum EstadoReserva {
  CONFIRMADO = 'confirmado',
  PENDIENTE = 'pendiente',
  CANCELADO = 'cancelado',
}

export class ReservaProductoDto {
  @ApiProperty({ description: 'ID del producto', example: 1 })
  @IsNumber()
  idProducto: number;

  @ApiProperty({ description: 'Nombre del producto', example: 'Laptop Dell Inspiron' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Cantidad reservada', example: 2 })
  @IsNumber()
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario', example: 150000 })
  @IsNumber()
  precioUnitario: number;
}

export class ReservaStockDto {
  @ApiProperty({ description: 'ID de la reserva', example: 1 })
  @IsNumber()
  idReserva: number;

  @ApiProperty({ description: 'ID de compra del sistema externo', example: 'COMPRA-XYZ-12345' })
  @IsString()
  idCompra: string;

  @ApiProperty({ description: 'ID del usuario', example: 123 })
  @IsNumber()
  usuarioId: number;

  @ApiProperty({ description: 'Estado de la reserva', enum: EstadoReserva, example: EstadoReserva.PENDIENTE })
  @IsEnum(EstadoReserva)
  estado: EstadoReserva;

  @ApiProperty({ description: 'Fecha de expiración en formato ISO 8601', example: '2025-01-20T10:30:00Z' })
  @IsString()
  expiresAt: string;

  @ApiProperty({ description: 'Fecha de creación en formato ISO 8601', example: '2025-01-17T10:30:00Z' })
  @IsString()
  fechaCreacion: string;

  @ApiProperty({ description: 'Fecha de actualización en formato ISO 8601', example: '2025-01-17T10:30:00Z' })
  @IsString()
  fechaActualizacion: string;

  @ApiProperty({ description: 'Productos en la reserva', type: [ReservaProductoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservaProductoDto)
  productos: ReservaProductoDto[];
}

export class ActualizarReservaDto {
  @ApiProperty({ description: 'ID del usuario propietario de la reserva', example: 123 })
  @IsNumber()
  usuarioId: number;

  @ApiProperty({ description: 'Nuevo estado de la reserva', enum: EstadoReserva, example: EstadoReserva.CONFIRMADO })
  @IsEnum(EstadoReserva)
  estado: EstadoReserva;
}
