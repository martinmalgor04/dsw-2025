import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, TransportMethod } from '@logistics/database';

export interface TariffCalculationInput {
  transportMethodId: string;
  billableWeight: number; // in kilograms
  distance: number; // in kilometers
  environment?: string;
}

export interface TariffCalculationResult {
  totalCost: number;
  breakdown: {
    baseTariff: number;
    weightCost: number;
    distanceCost: number;
    billableWeight: number;
    distance: number;
  };
  tariffConfig: {
    id: string;
    baseTariff: number;
    costPerKg: number;
    costPerKm: number;
    volumetricFactor: number;
  };
}

@Injectable()
export class TariffCalculationService {
  private readonly logger = new Logger(TariffCalculationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateTariff(input: TariffCalculationInput): Promise<TariffCalculationResult> {
    const { transportMethodId, billableWeight, distance, environment = 'development' } = input;

    const tariffConfig = await this.getTariffConfig(transportMethodId, environment);

    const baseTariff = Number(tariffConfig.baseTariff);
    const costPerKg = Number(tariffConfig.costPerKg);
    const costPerKm = Number(tariffConfig.costPerKm);

    const weightCost = billableWeight * costPerKg;
    const distanceCost = distance * costPerKm;
    const totalCost = baseTariff + weightCost + distanceCost;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      breakdown: {
        baseTariff,
        weightCost: Math.round(weightCost * 100) / 100,
        distanceCost: Math.round(distanceCost * 100) / 100,
        billableWeight,
        distance,
      },
      tariffConfig: {
        id: tariffConfig.id,
        baseTariff,
        costPerKg,
        costPerKm,
        volumetricFactor: tariffConfig.volumetricFactor,
      },
    };
  }

  private async getTariffConfig(transportMethodId: string, environment: string) {
    const now = new Date();
    const tariffConfig = await this.prisma.tariffConfig.findFirst({
      where: {
        transportMethodId,
        environment,
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      include: { transportMethod: true },
      orderBy: { validFrom: 'desc' },
    });
    if (!tariffConfig) {
      throw new Error(
        `No active tariff config for transport method ${transportMethodId} in environment ${environment}`,
      );
    }
    return tariffConfig;
  }

  async getVolumetricFactor(transportMethodId: string, environment = 'development'): Promise<number> {
    const cfg = await this.getTariffConfig(transportMethodId, environment);
    return cfg.volumetricFactor;
  }

  async calculateVolumetricWeight(
    dimensions: { length: number; width: number; height: number },
    transportMethodId: string,
    environment = 'development',
  ): Promise<number> {
    const factor = await this.getVolumetricFactor(transportMethodId, environment);
    const volumeInM3 = (dimensions.length * dimensions.width * dimensions.height) / 1_000_000;
    const w = volumeInM3 * factor;
    return Math.round(w * 100) / 100;
  }

  async calculateBillableWeight(
    realWeight: number,
    dimensions: { length: number; width: number; height: number },
    transportMethodId: string,
    environment = 'development',
  ): Promise<number> {
    const volumetric = await this.calculateVolumetricWeight(dimensions, transportMethodId, environment);
    return Math.max(realWeight, volumetric);
  }
}


