import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService, TransportMethod } from '@logistics/database';
import { CreateTransportMethodDto } from '../dto/create-transport-method.dto';
import { UpdateTransportMethodDto } from '../dto/update-transport-method.dto';

@Injectable()
export class TransportMethodService {
  private readonly logger = new Logger(TransportMethodService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todos los métodos de transporte
   */
  async findAll(): Promise<TransportMethod[]> {
    this.logger.log('Obteniendo todos los métodos de transporte');
    return this.prisma.transportMethod.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tariffConfigs: {
          where: { isActive: true },
        },
      },
    });
  }

  /**
   * Obtiene un método de transporte por ID
   */
  async findOne(id: string): Promise<TransportMethod> {
    this.logger.log(`Obteniendo método de transporte con ID: ${id}`);
    const transportMethod = await this.prisma.transportMethod.findUnique({
      where: { id },
      include: {
        tariffConfigs: {
          where: { isActive: true },
        },
      },
    });

    if (!transportMethod) {
      throw new NotFoundException(`Método de transporte con ID ${id} no encontrado`);
    }

    return transportMethod;
  }

  /**
   * Obtiene un método de transporte por código
   */
  async findByCode(code: string): Promise<TransportMethod> {
    this.logger.log(`Obteniendo método de transporte con código: ${code}`);
    const transportMethod = await this.prisma.transportMethod.findUnique({
      where: { code },
      include: {
        tariffConfigs: {
          where: { isActive: true },
        },
      },
    });

    if (!transportMethod) {
      throw new NotFoundException(`Método de transporte con código ${code} no encontrado`);
    }

    return transportMethod;
  }

  /**
   * Crea un nuevo método de transporte
   */
  async create(createTransportMethodDto: CreateTransportMethodDto): Promise<TransportMethod> {
    this.logger.log(`Creando nuevo método de transporte: ${createTransportMethodDto.name}`);

    // Verificar que el código no exista
    const existing = await this.prisma.transportMethod.findUnique({
      where: { code: createTransportMethodDto.code },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un método de transporte con el código ${createTransportMethodDto.code}`);
    }

    return this.prisma.transportMethod.create({
      data: createTransportMethodDto,
    });
  }

  /**
   * Actualiza un método de transporte existente
   */
  async update(id: string, updateTransportMethodDto: UpdateTransportMethodDto): Promise<TransportMethod> {
    this.logger.log(`Actualizando método de transporte con ID: ${id}`);

    // Verificar que existe
    await this.findOne(id);

    // Si se está actualizando el código, verificar que no exista
    if (updateTransportMethodDto.code) {
      const existing = await this.prisma.transportMethod.findUnique({
        where: { code: updateTransportMethodDto.code },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Ya existe un método de transporte con el código ${updateTransportMethodDto.code}`);
      }
    }

    return this.prisma.transportMethod.update({
      where: { id },
      data: updateTransportMethodDto,
    });
  }

  /**
   * Elimina (soft delete) un método de transporte
   */
  async remove(id: string): Promise<TransportMethod> {
    this.logger.log(`Desactivando método de transporte con ID: ${id}`);

    // Verificar que existe
    await this.findOne(id);

    return this.prisma.transportMethod.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

