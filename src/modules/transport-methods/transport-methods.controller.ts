import { Controller, Get } from '@nestjs/common';
import { TransportMethodsService } from './transport-methods.service';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@Controller('shipping/transport-methods')
export class TransportMethodsController {
  constructor(
    private readonly transportMethodsService: TransportMethodsService,
  ) {}

  @Get()
  async getTransportMethods(): Promise<TransportMethodsResponseDto> {
    return this.transportMethodsService.getTransportMethods();
  }
}

