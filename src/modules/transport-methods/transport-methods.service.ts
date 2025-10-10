import { Injectable } from '@nestjs/common';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@Injectable()
export class TransportMethodsService {
  constructor() {}

  async getTransportMethods(): Promise<TransportMethodsResponseDto> {
    // Retornar métodos de transporte mockeados
    return {
      transport_methods: [
        {
          type: 'air',
          name: 'Air Freight',
          estimated_days: '1-3',
        },
        {
          type: 'road',
          name: 'Road Transport',
          estimated_days: '3-7',
        },
        {
          type: 'rail',
          name: 'Rail Freight',
          estimated_days: '5-10',
        },
        {
          type: 'sea',
          name: 'Sea Freight',
          estimated_days: '15-30',
        },
      ],
    };
  }
}

