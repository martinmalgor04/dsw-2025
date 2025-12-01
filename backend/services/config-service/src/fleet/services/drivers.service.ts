import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService, Driver } from '@logistics/database';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    try {
      return await this.prisma.driver.create({
        data: createDriverDto,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const field = (error.meta?.target as string[])?.[0] || 'field';
        this.logger.warn(`Duplicate ${field}: ${createDriverDto[field as keyof CreateDriverDto]}`);
        throw new ConflictException(`Driver with this ${field} already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Driver[]> {
    return this.prisma.driver.findMany();
  }

  async findOne(id: string): Promise<Driver> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }
    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    await this.findOne(id); // Ensure driver exists
    return this.prisma.driver.update({
      where: { id },
      data: updateDriverDto,
    });
  }

  async remove(id: string): Promise<Driver> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    await this.findOne(id); // Ensure driver exists
    return this.prisma.driver.delete({
      where: { id },
    });
  }
}
