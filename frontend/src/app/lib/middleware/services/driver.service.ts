import { httpClient } from '../http/http-client';

export interface DriverDTO {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: string;
  status: string;
}

export interface CreateDriverDTO {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: 'A' | 'B' | 'C' | 'D';
  status: string;
}

export interface UpdateDriverDTO extends Partial<CreateDriverDTO> {
  status?: string;
}

export interface DriverFilters {
  status?: string;
}

class DriverService {
  async getDrivers(filters?: DriverFilters): Promise<DriverDTO[]> {
    return httpClient.get('/fleet/drivers', { params: filters });
  }

  async getDriver(id: string): Promise<DriverDTO> {
    return httpClient.get(`/fleet/drivers/${id}`);
  }

  async createDriver(dto: CreateDriverDTO): Promise<DriverDTO> {
    return httpClient.post('/fleet/drivers', dto);
  }

  async updateDriver(id: string, dto: UpdateDriverDTO): Promise<DriverDTO> {
    return httpClient.patch(`/fleet/drivers/${id}`, dto);
  }

  async deleteDriver(id: string): Promise<void> {
    return httpClient.delete(`/fleet/drivers/${id}`);
  }
}

export const driverService = new DriverService();
