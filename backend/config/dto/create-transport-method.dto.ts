import { IsString, IsInt, IsNumber, IsBoolean, IsOptional, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransportMethodDto {
  @ApiProperty({
    description: 'Código único del tipo de transporte',
    example: 'air',
    enum: ['air', 'sea', 'rail', 'road'],
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({
    description: 'Nombre del método de transporte',
    example: 'Aéreo',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del método de transporte',
    example: 'Transporte aéreo para envíos urgentes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Velocidad promedio en km/h',
    example: 800,
  })
  @IsInt()
  @Min(1)
  averageSpeed: number;

  @ApiProperty({
    description: 'Rango de días estimados de entrega',
    example: '1-3',
  })
  @IsString()
  @MaxLength(20)
  estimatedDays: string;

  @ApiProperty({
    description: 'Tarifa base por kilómetro',
    example: 0.8,
  })
  @IsNumber()
  @Min(0)
  baseCostPerKm: number;

  @ApiProperty({
    description: 'Tarifa base por kilogramo',
    example: 5.0,
  })
  @IsNumber()
  @Min(0)
  baseCostPerKg: number;

  @ApiPropertyOptional({
    description: 'Indica si el método está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

