import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@Injectable()
export class TransportMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransportMethods(): Promise<TransportMethodsResponseDto> {
    // Obtener métodos de transporte desde la base de datos
    const transportMethods = await this.prisma.transportMethod.findMany({
      where: {
        isActive: true,
      },
      select: {
        code: true,
        name: true,
        estimatedDays: true,
      },
    });

    // Transformar a formato de respuesta externa
    return {
      transport_methods: transportMethods.map(method => ({
        type: method.code,
        name: method.name,
        estimated_days: method.estimatedDays,
      })),
    };
  }
}

