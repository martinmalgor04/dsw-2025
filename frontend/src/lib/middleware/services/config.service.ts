import { configHttpClient } from '../http/config-client';

export interface TransportMethod {
  id: string;
  code: string;
  name: string;
  description?: string;
  averageSpeed: number;
  estimatedDays: string;
  baseCostPerKm: number;
  baseCostPerKg: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransportMethodDTO {
  code: string;
  name: string;
  description?: string;
  averageSpeed: number;
  estimatedDays: string;
  baseCostPerKm: number;
  baseCostPerKg: number;
  isActive?: boolean;
}

export interface UpdateTransportMethodDTO extends Partial<CreateTransportMethodDTO> {}

export interface CoverageZone {
  id: string;
  name: string;
  description?: string;
  postalCodes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoverageZoneDTO {
  name: string;
  description?: string;
  postalCodes: string[];
  isActive?: boolean;
}

export interface UpdateCoverageZoneDTO extends Partial<CreateCoverageZoneDTO> {}

class ConfigService {
  async getTransportMethods(): Promise<TransportMethod[]> {
    return configHttpClient.get('/config/transport-methods');
  }

  async getTransportMethod(id: string): Promise<TransportMethod> {
    return configHttpClient.get(`/config/transport-methods/${id}`);
  }

  async createTransportMethod(dto: CreateTransportMethodDTO): Promise<TransportMethod> {
    return configHttpClient.post('/config/transport-methods', dto);
  }

  async updateTransportMethod(id: string, dto: UpdateTransportMethodDTO): Promise<TransportMethod> {
    return configHttpClient.patch(`/config/transport-methods/${id}`, dto);
  }

  async deleteTransportMethod(id: string): Promise<void> {
    return configHttpClient.delete(`/config/transport-methods/${id}`);
  }

  async getCoverageZones(): Promise<CoverageZone[]> {
    return configHttpClient.get('/config/coverage-zones');
  }

  async getCoverageZone(id: string): Promise<CoverageZone> {
    return configHttpClient.get(`/config/coverage-zones/${id}`);
  }

  async createCoverageZone(dto: CreateCoverageZoneDTO): Promise<CoverageZone> {
    return configHttpClient.post('/config/coverage-zones', dto);
  }

  async updateCoverageZone(id: string, dto: UpdateCoverageZoneDTO): Promise<CoverageZone> {
    return configHttpClient.patch(`/config/coverage-zones/${id}`, dto);
  }
}

export const configService = new ConfigService();
