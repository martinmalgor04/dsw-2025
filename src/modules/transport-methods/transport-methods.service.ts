import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@Injectable()
export class TransportMethodsService {
  constructor(private prisma: PrismaService) {}

  async getTransportMethods(): Promise<TransportMethodsResponseDto> {
    const methods = await this.prisma.transportMethod.findMany({
      where: {
        isActive: true,
      },
    });

    // Si no hay métodos en BD, retornar valores por defecto
    if (methods.length === 0) {
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

    return {
      transport_methods: methods.map((m) => ({
        type: m.type.toLowerCase(),
        name: m.name,
        estimated_days: m.estimatedDays,
      })),
    };
  }
}

