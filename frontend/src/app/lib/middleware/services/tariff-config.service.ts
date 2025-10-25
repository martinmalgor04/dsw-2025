import { httpClient } from '../http/http-client';

export interface TariffConfigDTO {
  id: string;
  transportMethodId: string;
  transportMethod?: {
    id: string;
    code: string;
    name: string;
  };
  baseTariff: number;
  costPerKg: number;
  costPerKm: number;
  volumetricFactor: number;
  environment?: string;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTariffConfigDTO {
  transportMethodId: string;
  baseTariff: number;
  costPerKg: number;
  costPerKm: number;
  volumetricFactor: number;
  environment?: string;
  isActive?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface UpdateTariffConfigDTO extends Partial<CreateTariffConfigDTO> {
  // Inherits all properties from CreateTariffConfigDTO as optional
}

export interface TariffConfigFilters {
  transportMethodId?: string;
  isActive?: boolean;
  environment?: string;
}

class TariffConfigService {
  async getTariffConfigs(filters?: TariffConfigFilters): Promise<TariffConfigDTO[]> {
    return httpClient.get('/config/tariff-configs', { params: filters });
  }

  async getTariffConfig(id: string): Promise<TariffConfigDTO> {
    return httpClient.get(`/config/tariff-configs/${id}`);
  }

  async createTariffConfig(dto: CreateTariffConfigDTO): Promise<TariffConfigDTO> {
    return httpClient.post('/config/tariff-configs', dto);
  }

  async updateTariffConfig(id: string, dto: UpdateTariffConfigDTO): Promise<TariffConfigDTO> {
    return httpClient.patch(`/config/tariff-configs/${id}`, dto);
  }

  async deleteTariffConfig(id: string): Promise<void> {
    return httpClient.delete(`/config/tariff-configs/${id}`);
  }
}

export const tariffConfigService = new TariffConfigService();