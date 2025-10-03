import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.item.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: {
        items,
        total: items.length,
        fechaConsulta: new Date().toISOString(),
      },
      message: 'Items obtenidos exitosamente'
    };
  }

  async create(data: { name: string; description?: string }) {
    const item = await this.prisma.item.create({
      data,
    });

    return {
      success: true,
      data: {
        item,
        fechaCreacion: new Date().toISOString(),
      },
      message: 'Item creado exitosamente'
    };
  }
}
