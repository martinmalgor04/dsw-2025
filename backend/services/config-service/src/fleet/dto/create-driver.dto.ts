import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({
    description: 'ID de empleado único',
    example: 'EMP12345',
  })
  @IsString()
  @MinLength(2)
  employeeId: string;

  @ApiProperty({
    description: 'Nombre del conductor',
    example: 'Juan',
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del conductor',
    example: 'García',
  })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'Email del conductor',
    example: 'juan.garcia@empresa.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Número de teléfono',
    example: '+5493814123456',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Número de licencia de conducir',
    example: 'LIC123456789',
  })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    description: 'Tipo de licencia',
    example: 'C',
    enum: ['A', 'B', 'C', 'D', 'E'],
  })
  @IsString()
  licenseType: string;

  @ApiProperty({
    description: 'Estado del conductor',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
  })
  @IsString()
  status: string;
}
