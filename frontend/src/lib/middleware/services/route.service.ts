import { httpClient } from '../http/http-client';

export interface RouteDTO {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  transportMethodId: string;
  vehicleId?: string;
  driverId?: string;
  coverageZoneId?: string;
}

export interface CreateRouteDTO {
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  transportMethodId: string;
  vehicleId?: string;
  driverId?: string;
  coverageZoneId?: string;
}

export interface UpdateRouteDTO extends Partial<CreateRouteDTO> {}

export interface RouteStopDTO {
  id: string;
  routeId: string;
  sequence: number;
  type: string;
  address: any;
  coordinates?: any;
  scheduledTime?: string;
  actualTime?: string;
  status: string;
}

export interface CreateRouteStopDTO {
  sequence: number;
  type: string;
  address: any;
  coordinates?: any;
  scheduledTime?: string;
  status: string;
}

class RouteService {
  async getRoutes(): Promise<RouteDTO[]> {
    return httpClient.get('/routes');
  }

  async getRoute(id: string): Promise<RouteDTO> {
    return httpClient.get(`/routes/${id}`);
  }

  async createRoute(dto: CreateRouteDTO): Promise<RouteDTO> {
    return httpClient.post('/routes', dto);
  }

  async updateRoute(id: string, dto: UpdateRouteDTO): Promise<RouteDTO> {
    return httpClient.patch(`/routes/${id}`, dto);
  }

  async deleteRoute(id: string): Promise<void> {
    return httpClient.delete(`/routes/${id}`);
  }

  async getRouteStops(routeId: string): Promise<RouteStopDTO[]> {
    return httpClient.get(`/routes/${routeId}/stops`);
  }

  async addRouteStop(routeId: string, dto: CreateRouteStopDTO): Promise<RouteStopDTO> {
    return httpClient.post(`/routes/${routeId}/stops`, dto);
  }
}

export const routeService = new RouteService();
