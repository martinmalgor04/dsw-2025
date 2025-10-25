import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PrismaService, TransportMethod, CoverageZone, TariffConfig } from '@logistics/database';
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

  // Tariff Config Methods
  async getAllTariffConfigs(transportMethodId?: string): Promise<TariffConfig[]> {
    this.logger.startOperation('getAllTariffConfigs', { transportMethodId });
    
    try {
      const where = transportMethodId ? { transportMethodId } : {};
      const configs = await this.prisma.tariffConfig.findMany({
        where,
        include: {
          transportMethod: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.endOperation('getAllTariffConfigs', { count: configs.length });
      return configs;
    } catch (error) {
      this.logger.errorWithContext('Failed to get tariff configs', error, { transportMethodId });
      throw error;
    }
  }

  async createTariffConfig(data: any): Promise<TariffConfig> {
    this.logger.startOperation('createTariffConfig', { transportMethodId: data.transportMethodId });
    
    try {
      const config = await this.prisma.tariffConfig.create({
        data: {
          transportMethodId: data.transportMethodId,
          baseTariff: data.baseTariff,
          costPerKg: data.costPerKg,
          costPerKm: data.costPerKm,
          volumetricFactor: data.volumetricFactor,
          environment: data.environment || 'development',
          isActive: data.isActive ?? true,
          validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
          validTo: data.validTo ? new Date(data.validTo) : null,
        },
        include: {
          transportMethod: true,
        },
      });

      this.logger.endOperation('createTariffConfig', { id: config.id });
      return config;
    } catch (error) {
      this.logger.errorWithContext('Failed to create tariff config', error, { transportMethodId: data.transportMethodId });
      throw error;
    }
  }

  async getTariffConfigById(id: string): Promise<TariffConfig> {
    this.logger.startOperation('getTariffConfigById', { id });
    
    try {
      const config = await this.prisma.tariffConfig.findUniqueOrThrow({
        where: { id },
        include: {
          transportMethod: true,
        },
      });

      this.logger.endOperation('getTariffConfigById', { id });
      return config;
    } catch (error) {
      this.logger.errorWithContext('Failed to get tariff config', error, { id });
      throw error;
    }
  }

  async updateTariffConfig(id: string, data: any): Promise<TariffConfig> {
    this.logger.startOperation('updateTariffConfig', { id });
    
    try {
      const updateData: any = {};
      
      if (data.transportMethodId !== undefined) {
        updateData.transportMethodId = data.transportMethodId;
      }
      if (data.baseTariff !== undefined) {
        updateData.baseTariff = data.baseTariff;
      }
      if (data.costPerKg !== undefined) {
        updateData.costPerKg = data.costPerKg;
      }
      if (data.costPerKm !== undefined) {
        updateData.costPerKm = data.costPerKm;
      }
      if (data.volumetricFactor !== undefined) {
        updateData.volumetricFactor = data.volumetricFactor;
      }
      if (data.environment !== undefined) {
        updateData.environment = data.environment;
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }
      if (data.validFrom !== undefined) {
        updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null;
      }
      if (data.validTo !== undefined) {
        updateData.validTo = data.validTo ? new Date(data.validTo) : null;
      }

      const config = await this.prisma.tariffConfig.update({
        where: { id },
        data: updateData,
        include: {
          transportMethod: true,
        },
      });

      this.logger.endOperation('updateTariffConfig', { id });
      return config;
    } catch (error) {
      this.logger.errorWithContext('Failed to update tariff config', error, { id });
      throw error;
    }
  }

  async deleteTariffConfig(id: string): Promise<void> {
    this.logger.startOperation('deleteTariffConfig', { id });
    
    try {
      await this.prisma.tariffConfig.delete({
        where: { id },
      });

      this.logger.endOperation('deleteTariffConfig', { id });
    } catch (error) {
      this.logger.errorWithContext('Failed to delete tariff config', error, { id });
      throw error;
    }
  }
}