import { httpClient } from '../http/http-client';

export interface VehicleDTO {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  capacityKg: number;
  volumeM3: number;
  fuelType: string;
  status: string;
}

export interface CreateVehicleDTO {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  capacityKg: number;
  volumeM3: number;
  fuelType: 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'GNC';
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> {
  status?: string;
}

export interface VehicleFilters {
  status?: string;
}

class VehicleService {
  async getVehicles(filters?: VehicleFilters): Promise<VehicleDTO[]> {
    return httpClient.get('/vehicles', { params: filters });
  }

  async getVehicle(id: string): Promise<VehicleDTO> {
    return httpClient.get(`/vehicles/${id}`);
  }

  async createVehicle(dto: CreateVehicleDTO): Promise<VehicleDTO> {
    return httpClient.post('/vehicles', dto);
  }

  async updateVehicle(id: string, dto: UpdateVehicleDTO): Promise<VehicleDTO> {
    return httpClient.patch(`/vehicles/${id}`, dto);
  }

  async deleteVehicle(id: string): Promise<void> {
    return httpClient.delete(`/vehicles/${id}`);
  }
}

export const vehicleService = new VehicleService();
