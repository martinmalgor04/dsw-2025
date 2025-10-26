import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, TariffConfig } from '@logistics/database';
import { CreateTariffConfigDto } from '../dto/create-tariff-config.dto';
import { UpdateTariffConfigDto } from '../dto/update-tariff-config.dto';

@Injectable()
export class TariffConfigService {
  private readonly logger = new Logger(TariffConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva configuración de tarifa
   */
  async create(
    createTariffConfigDto: CreateTariffConfigDto,
  ): Promise<TariffConfig> {
    this.logger.log(
      `Creando configuración de tarifa para método: ${createTariffConfigDto.transportMethodId}`,
    );

    return this.prisma.tariffConfig.create({
      data: {
        transportMethodId: createTariffConfigDto.transportMethodId,
        baseTariff: createTariffConfigDto.baseTariff,
        costPerKg: createTariffConfigDto.costPerKg,
        costPerKm: createTariffConfigDto.costPerKm,
        volumetricFactor: createTariffConfigDto.volumetricFactor,
        environment: createTariffConfigDto.environment || 'development',
        isActive: createTariffConfigDto.isActive ?? true,
        validFrom: createTariffConfigDto.validFrom
          ? new Date(createTariffConfigDto.validFrom)
          : new Date(),
        validTo: createTariffConfigDto.validTo
          ? new Date(createTariffConfigDto.validTo)
          : null,
      },
      include: {
        transportMethod: true,
      },
    });
  }

  /**
   * Obtiene todas las configuraciones de tarifa
   */
  async findAll(): Promise<TariffConfig[]> {
    this.logger.log('Obteniendo todas las configuraciones de tarifa');
    return this.prisma.tariffConfig.findMany({
      include: {
        transportMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene una configuración de tarifa por ID
   */
  async findOne(id: string): Promise<TariffConfig> {
    this.logger.log(`Obteniendo configuración de tarifa con ID: ${id}`);

    const tariffConfig = await this.prisma.tariffConfig.findUnique({
      where: { id },
      include: {
        transportMethod: true,
      },
    });

    if (!tariffConfig) {
      throw new NotFoundException(
        `Configuración de tarifa con ID ${id} no encontrada`,
      );
    }

    return tariffConfig;
  }

  /**
   * Actualiza una configuración de tarifa
   */
  async update(
    id: string,
    updateTariffConfigDto: UpdateTariffConfigDto,
  ): Promise<TariffConfig> {
    this.logger.log(`Actualizando configuración de tarifa con ID: ${id}`);

    // Verificar que existe
    await this.findOne(id);

    const updateData: any = {};

    if (updateTariffConfigDto.transportMethodId !== undefined) {
      updateData.transportMethodId = updateTariffConfigDto.transportMethodId;
    }
    if (updateTariffConfigDto.baseTariff !== undefined) {
      updateData.baseTariff = updateTariffConfigDto.baseTariff;
    }
    if (updateTariffConfigDto.costPerKg !== undefined) {
      updateData.costPerKg = updateTariffConfigDto.costPerKg;
    }
    if (updateTariffConfigDto.costPerKm !== undefined) {
      updateData.costPerKm = updateTariffConfigDto.costPerKm;
    }
    if (updateTariffConfigDto.volumetricFactor !== undefined) {
      updateData.volumetricFactor = updateTariffConfigDto.volumetricFactor;
    }
    if (updateTariffConfigDto.environment !== undefined) {
      updateData.environment = updateTariffConfigDto.environment;
    }
    if (updateTariffConfigDto.isActive !== undefined) {
      updateData.isActive = updateTariffConfigDto.isActive;
    }
    if (updateTariffConfigDto.validFrom !== undefined) {
      updateData.validFrom = updateTariffConfigDto.validFrom
        ? new Date(updateTariffConfigDto.validFrom)
        : null;
    }
    if (updateTariffConfigDto.validTo !== undefined) {
      updateData.validTo = updateTariffConfigDto.validTo
        ? new Date(updateTariffConfigDto.validTo)
        : null;
    }

    return this.prisma.tariffConfig.update({
      where: { id },
      data: updateData,
      include: {
        transportMethod: true,
      },
    });
  }

  /**
   * Elimina una configuración de tarifa
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Eliminando configuración de tarifa con ID: ${id}`);

    // Verificar que existe
    await this.findOne(id);

    await this.prisma.tariffConfig.delete({
      where: { id },
    });
  }

  /**
   * Obtiene configuraciones de tarifa por método de transporte
   */
  async findByTransportMethod(
    transportMethodId: string,
  ): Promise<TariffConfig[]> {
    this.logger.log(
      `Obteniendo configuraciones de tarifa para método: ${transportMethodId}`,
    );

    return this.prisma.tariffConfig.findMany({
      where: { transportMethodId },
      include: {
        transportMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
