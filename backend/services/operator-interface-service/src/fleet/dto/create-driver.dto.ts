import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  employeeId: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  licenseNumber: string;

  @ApiProperty()
  @IsString()
  licenseType: string;

  @ApiProperty({ default: 'ACTIVE' })
  @IsString()
  status: string;
}
