import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, Vehicle } from '@logistics/database';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    return this.prisma.vehicle.create({
      data: createVehicleDto,
    });
  }

  async findAll(): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }
    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });
  }

  async remove(id: string): Promise<Vehicle> {
    await this.findOne(id);
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
