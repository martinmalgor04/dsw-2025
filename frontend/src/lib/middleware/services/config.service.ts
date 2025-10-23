import { httpClient } from '../http/http-client';

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
    return httpClient.get('/config/transport-methods');
  }

  async getTransportMethod(id: string): Promise<TransportMethod> {
    return httpClient.get(`/config/transport-methods/${id}`);
  }

  async createTransportMethod(dto: CreateTransportMethodDTO): Promise<TransportMethod> {
    return httpClient.post('/config/transport-methods', dto);
  }

  async updateTransportMethod(id: string, dto: UpdateTransportMethodDTO): Promise<TransportMethod> {
    return httpClient.patch(`/config/transport-methods/${id}`, dto);
  }

  async getCoverageZones(): Promise<CoverageZone[]> {
    return httpClient.get('/config/coverage-zones');
  }

  async getCoverageZone(id: string): Promise<CoverageZone> {
    return httpClient.get(`/config/coverage-zones/${id}`);
  }

  async createCoverageZone(dto: CreateCoverageZoneDTO): Promise<CoverageZone> {
    return httpClient.post('/config/coverage-zones', dto);
  }

  async updateCoverageZone(id: string, dto: UpdateCoverageZoneDTO): Promise<CoverageZone> {
    return httpClient.patch(`/config/coverage-zones/${id}`, dto);
  }
}

export const configService = new ConfigService();
