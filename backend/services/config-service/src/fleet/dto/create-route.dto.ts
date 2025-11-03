import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: 'PLANIFIED' })
  @IsString()
  status: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsUUID()
  transportMethodId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  coverageZoneId?: string;
}
