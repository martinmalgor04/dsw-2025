import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PrismaService, TransportMethod, CoverageZone } from '@logistics/database';
import { LoggerService } from '@logistics/utils';

@Injectable()
export class ConfigService {
  private readonly logger = new LoggerService(ConfigService.name);
  private readonly configServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: NestConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.configServiceUrl = this.configService.get<string>('CONFIG_SERVICE_URL', 'http://localhost:3003');
  }

  /**
   * Por ahora accede directamente a la base de datos
   * Luego se cambiará para usar HTTP calls al config-service
   */

  // Transport Methods
  async getAllTransportMethods(): Promise<TransportMethod[]> {
    this.logger.startOperation('getAllTransportMethods');
    
    try {
      const methods = await this.prisma.transportMethod.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          tariffConfigs: {
            where: { isActive: true },
          },
        },
      });

      this.logger.endOperation('getAllTransportMethods');
      return methods;
    } catch (error) {
      this.logger.errorWithContext('Failed to get transport methods', error);
      throw error;
    }
  }

  async getTransportMethodById(id: string): Promise<TransportMethod> {
    this.logger.startOperation('getTransportMethodById', { id });
    
    try {
      const method = await this.prisma.transportMethod.findUniqueOrThrow({
        where: { id },
        include: {
          tariffConfigs: {
            where: { isActive: true },
          },
        },
      });

      this.logger.endOperation('getTransportMethodById', { id });
      return method;
    } catch (error) {
      this.logger.errorWithContext('Failed to get transport method', error, { id });
      throw error;
    }
  }

  async createTransportMethod(data: any): Promise<TransportMethod> {
    this.logger.startOperation('createTransportMethod', { code: data.code });
    
    try {
      const method = await this.prisma.transportMethod.create({
        data,
        include: {
          tariffConfigs: true,
        },
      });

      this.logger.endOperation('createTransportMethod', { id: method.id, code: method.code });
      return method;
    } catch (error) {
      this.logger.errorWithContext('Failed to create transport method', error, { code: data.code });
      throw error;
    }
  }

  async updateTransportMethod(id: string, data: any): Promise<TransportMethod> {
    this.logger.startOperation('updateTransportMethod', { id });
    
    try {
      const method = await this.prisma.transportMethod.update({
        where: { id },
        data,
        include: {
          tariffConfigs: true,
        },
      });

      this.logger.endOperation('updateTransportMethod', { id });
      return method;
    } catch (error) {
      this.logger.errorWithContext('Failed to update transport method', error, { id });
      throw error;
    }
  }

  // Coverage Zones
  async getAllCoverageZones(): Promise<CoverageZone[]> {
    this.logger.startOperation('getAllCoverageZones');
    
    try {
      const zones = await this.prisma.coverageZone.findMany({
        orderBy: { createdAt: 'desc' },
      });

      this.logger.endOperation('getAllCoverageZones');
      return zones;
    } catch (error) {
      this.logger.errorWithContext('Failed to get coverage zones', error);
      throw error;
    }
  }

  async getCoverageZoneById(id: string) {
    this.logger.startOperation('getCoverageZoneById', { id });
    
    try {
      const zone = await this.prisma.coverageZone.findUniqueOrThrow({
        where: { id },
      });

      this.logger.endOperation('getCoverageZoneById', { id });
      return zone;
    } catch (error) {
      this.logger.errorWithContext('Failed to get coverage zone', error, { id });
      throw error;
    }
  }

  async createCoverageZone(data: any) {
    this.logger.startOperation('createCoverageZone', { name: data.name });
    
    try {
      const zone = await this.prisma.coverageZone.create({
        data,
      });

      this.logger.endOperation('createCoverageZone', { id: zone.id, name: zone.name });
      return zone;
    } catch (error) {
      this.logger.errorWithContext('Failed to create coverage zone', error, { name: data.name });
      throw error;
    }
  }

  async updateCoverageZone(id: string, data: any) {
    this.logger.startOperation('updateCoverageZone', { id });
    
    try {
      const zone = await this.prisma.coverageZone.update({
        where: { id },
        data,
      });

      this.logger.endOperation('updateCoverageZone', { id });
      return zone;
    } catch (error) {
      this.logger.errorWithContext('Failed to update coverage zone', error, { id });
      throw error;
    }
  }
}