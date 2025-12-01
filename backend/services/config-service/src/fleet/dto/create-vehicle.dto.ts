import { IsString, IsInt, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Matrícula/Placa del vehículo',
    example: 'ABC-123-DEF',
  })
  @IsString()
  license_plate: string;

  @ApiProperty({
    description: 'Marca del vehículo',
    example: 'Volvo',
  })
  @IsString()
  make: string;

  @ApiProperty({
    description: 'Modelo del vehículo',
    example: 'FH16',
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Año de fabricación',
    example: 2022,
  })
  @IsInt()
  year: number;

  @ApiProperty({
    description: 'Capacidad de carga en kilogramos',
    example: 25000,
  })
  @IsInt()
  capacityKg: number;

  @ApiProperty({
    description: 'Volumen de carga en metros cúbicos',
    example: 85.5,
  })
  @IsNumber()
  volumeM3: number;

  @ApiProperty({
    description: 'Tipo de combustible',
    example: 'DIESEL',
    enum: ['DIESEL', 'GASOLINE', 'HYBRID', 'ELECTRIC'],
  })
  @IsString()
  fuelType: string;

  @ApiProperty({
    description: 'Estado del vehículo',
    example: 'AVAILABLE',
    enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
    default: 'AVAILABLE',
  })
  @IsString()
  status: string;
}
