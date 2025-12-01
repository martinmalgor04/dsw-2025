import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, Route } from '@logistics/database';
import { CreateRouteDto } from '../dto/create-route.dto';
import { UpdateRouteDto } from '../dto/update-route.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    return this.prisma.route.create({
      data: createRouteDto,
    });
  }

  async findAll(): Promise<Route[]> {
    return this.prisma.route.findMany({
      include: {
        transportMethod: true,
        vehicle: true,
        driver: true,
        coverageZone: true,
      },
    });
  }

  async findOne(id: string): Promise<Route> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        transportMethod: true,
        vehicle: true,
        driver: true,
        coverageZone: true,
        stops: true,
      },
    });
    if (!route) {
      throw new NotFoundException(`Route with ID "${id}" not found`);
    }
    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    await this.findOne(id);
    return this.prisma.route.update({
      where: { id },
      data: updateRouteDto,
    });
  }

  async remove(id: string): Promise<Route> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    await this.findOne(id);
    return this.prisma.route.delete({
      where: { id },
    });
  }
}
