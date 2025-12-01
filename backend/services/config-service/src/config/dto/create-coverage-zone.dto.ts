import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCoverageZoneDto {
  @ApiProperty({
    description: 'Nombre de la zona de cobertura',
    example: 'Buenos Aires Capital',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de la zona de cobertura',
    example: 'Capital Federal y zonas aledañas',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array de códigos postales argentinos cubiertos',
    example: ['C1000', 'C1001', 'C1002'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  postalCodes: string[];

  @ApiPropertyOptional({
    description: 'Indica si la zona está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
