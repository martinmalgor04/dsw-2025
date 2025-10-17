import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoverageZoneDto } from '../dto/create-coverage-zone.dto';
import { UpdateCoverageZoneDto } from '../dto/update-coverage-zone.dto';

@Injectable()
export class CoverageZoneService {
  private readonly logger = new Logger(CoverageZoneService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todas las zonas de cobertura
   */
  async findAll() {
    this.logger.log('Obteniendo todas las zonas de cobertura');
    return this.prisma.coverageZone.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene una zona de cobertura por ID
   */
  async findOne(id: string) {
    this.logger.log(`Obteniendo zona de cobertura con ID: ${id}`);
    const zone = await this.prisma.coverageZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException(`Zona de cobertura con ID ${id} no encontrada`);
    }

    return zone;
  }

  /**
   * Busca zonas de cobertura que incluyan un código postal específico
   */
  async findByPostalCode(postalCode: string) {
    this.logger.log(`Buscando zonas de cobertura para código postal: ${postalCode}`);
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
  async create(createCoverageZoneDto: CreateCoverageZoneDto) {
    this.logger.log(`Creando nueva zona de cobertura: ${createCoverageZoneDto.name}`);

    return this.prisma.coverageZone.create({
      data: createCoverageZoneDto,
    });
  }

  /**
   * Actualiza una zona de cobertura existente
   */
  async update(id: string, updateCoverageZoneDto: UpdateCoverageZoneDto) {
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
  async remove(id: string) {
    this.logger.log(`Desactivando zona de cobertura con ID: ${id}`);

    // Verificar que existe
    await this.findOne(id);

    return this.prisma.coverageZone.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

