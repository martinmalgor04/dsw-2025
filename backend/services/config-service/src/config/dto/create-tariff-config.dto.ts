import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTariffConfigDto {
  @ApiProperty({
    description: 'ID del método de transporte',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  transportMethodId: string;

  @ApiProperty({
    description: 'Tarifa base',
    example: 100.5,
  })
  @IsNumber()
  @Min(0)
  baseTariff: number;

  @ApiProperty({
    description: 'Costo por kilogramo',
    example: 5.25,
  })
  @IsNumber()
  @Min(0)
  costPerKg: number;

  @ApiProperty({
    description: 'Costo por kilómetro',
    example: 2.1,
  })
  @IsNumber()
  @Min(0)
  costPerKm: number;

  @ApiProperty({
    description: 'Factor volumétrico',
    example: 167,
  })
  @IsNumber()
  @Min(0)
  volumetricFactor: number;

  @ApiPropertyOptional({
    description: 'Entorno de aplicación',
    example: 'production',
    default: 'development',
  })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({
    description: 'Indica si la configuración está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de validez',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin de validez',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
