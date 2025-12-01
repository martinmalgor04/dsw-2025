import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService, Vehicle } from '@logistics/database';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    try {
      return await this.prisma.vehicle.create({
        data: createVehicleDto,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const field = (error.meta?.target as string[])?.[0] || 'field';
        this.logger.warn(`Duplicate ${field}: ${createVehicleDto[field as keyof CreateVehicleDto]}`);
        throw new ConflictException(`Vehicle with this ${field} already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany();
  }

  async findOne(id: string): Promise<Vehicle> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }
    return vehicle;
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });
  }

  async remove(id: string): Promise<Vehicle> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    await this.findOne(id);
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
