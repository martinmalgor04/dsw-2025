import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService, CoverageZone } from '@logistics/database';
import { CreateCoverageZoneDto } from '../dto/create-coverage-zone.dto';
import { UpdateCoverageZoneDto } from '../dto/update-coverage-zone.dto';

@Injectable()
export class CoverageZoneService {
  private readonly logger = new Logger(CoverageZoneService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todas las zonas de cobertura
   */
  async findAll(): Promise<CoverageZone[]> {
    this.logger.log('Obteniendo todas las zonas de cobertura');
    return this.prisma.coverageZone.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene una zona de cobertura por ID
   */
  async findOne(id: string): Promise<CoverageZone> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    this.logger.log(`Obteniendo zona de cobertura con ID: ${id}`);
    const zone = await this.prisma.coverageZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException(
        `Zona de cobertura con ID ${id} no encontrada`,
      );
    }

    return zone;
  }

  /**
   * Busca zonas de cobertura que incluyan un código postal específico
   */
  async findByPostalCode(postalCode: string): Promise<CoverageZone[]> {
    this.logger.log(
      `Buscando zonas de cobertura para código postal: ${postalCode}`,
    );
    return this.prisma.coverageZone.findMany({
      where: {
        postalCodes: {
          has: postalCode,
        },
        isActive: true,
      },
    });
  }

  /**
   * Crea una nueva zona de cobertura
   */
  async create(
    createCoverageZoneDto: CreateCoverageZoneDto,
  ): Promise<CoverageZone> {
    this.logger.log(
      `Creando nueva zona de cobertura: ${createCoverageZoneDto.name}`,
    );

    // Check for duplicate name
    const existing = await this.prisma.coverageZone.findFirst({
      where: { name: createCoverageZoneDto.name },
    });

    if (existing) {
      this.logger.warn(`Duplicate name: ${createCoverageZoneDto.name}`);
      throw new ConflictException(`Coverage zone with name "${createCoverageZoneDto.name}" already exists`);
    }

    try {
      return await this.prisma.coverageZone.create({
        data: createCoverageZoneDto,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const field = (error.meta?.target as string[])?.[0] || 'field';
        this.logger.warn(`Duplicate ${field}: ${createCoverageZoneDto[field as keyof CreateCoverageZoneDto]}`);
        throw new ConflictException(`Coverage zone with this ${field} already exists`);
      }
      throw error;
    }
  }

  /**
   * Actualiza una zona de cobertura existente
   */
  async update(
    id: string,
    updateCoverageZoneDto: UpdateCoverageZoneDto,
  ): Promise<CoverageZone> {
    this.logger.log(`Actualizando zona de cobertura con ID: ${id}`);

    // Verificar que existe
    await this.findOne(id);

    return this.prisma.coverageZone.update({
      where: { id },
      data: updateCoverageZoneDto,
    });
  }

  /**
   * Elimina (soft delete) una zona de cobertura
   */
  async remove(id: string): Promise<CoverageZone> {
    this.logger.log(`Desactivando zona de cobertura con ID: ${id}`);

    // Verificar que existe
    await this.findOne(id);

    return this.prisma.coverageZone.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
