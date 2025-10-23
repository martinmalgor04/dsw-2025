import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, Driver } from '@logistics/database';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    return this.prisma.driver.create({
      data: createDriverDto,
    });
  }

  async findAll(): Promise<Driver[]> {
    return this.prisma.driver.findMany();
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }
    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    await this.findOne(id); // Ensure driver exists
    return this.prisma.driver.update({
      where: { id },
      data: updateDriverDto,
    });
  }

  async remove(id: string): Promise<Driver> {
    await this.findOne(id); // Ensure driver exists
    return this.prisma.driver.delete({
      where: { id },
    });
  }
}
