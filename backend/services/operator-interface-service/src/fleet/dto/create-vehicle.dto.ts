import { IsString, IsInt, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty()
  @IsString()
  licensePlate: string;

  @ApiProperty()
  @IsString()
  make: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsInt()
  capacityKg: number;

  @ApiProperty()
  @IsNumber()
  volumeM3: number;

  @ApiProperty()
  @IsString()
  fuelType: string;

  @ApiProperty({ default: 'AVAILABLE' })
  @IsString()
  status: string;
}
