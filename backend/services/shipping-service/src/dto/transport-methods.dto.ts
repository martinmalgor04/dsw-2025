import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsEnum } from 'class-validator';
import { TransportType } from '../enums/transport-type.enum';

export class TransportMethodDto {
  @ApiProperty({
    description: 'Type of transport',
    enum: ['air', 'sea', 'rail', 'road'],
    example: 'air',
  })
  @IsEnum(['air', 'sea', 'rail', 'road'])
  type: string;

  @ApiProperty({ description: 'Name of the transport method', example: 'Air Freight' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Estimated days for delivery', example: '1-3' })
  @IsString()
  estimated_days: string;
}

export class TransportMethodsResponseDto {
  @ApiProperty({ type: [TransportMethodDto] })
  @IsArray()
  transport_methods: TransportMethodDto[];
}

