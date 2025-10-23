import { httpClient } from '../http/http-client';
import { TransportMethod } from './config.service';
import { DriverDTO } from './driver.service';
import { VehicleDTO } from './vehicle.service';

export interface RouteDTO {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  transportMethod: TransportMethod;
  vehicle?: VehicleDTO;
  driver?: DriverDTO;
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
    return httpClient.get('/fleet/routes');
  }

  async getRoute(id: string): Promise<RouteDTO> {
    return httpClient.get(`/fleet/routes/${id}`);
  }

  async createRoute(dto: CreateRouteDTO): Promise<RouteDTO> {
    return httpClient.post('/fleet/routes', dto);
  }

  async updateRoute(id: string, dto: UpdateRouteDTO): Promise<RouteDTO> {
    return httpClient.patch(`/fleet/routes/${id}`, dto);
  }

  async deleteRoute(id: string): Promise<void> {
    return httpClient.delete(`/fleet/routes/${id}`);
  }

  async getRouteStops(routeId: string): Promise<RouteStopDTO[]> {
    return httpClient.get(`/fleet/routes/${routeId}/stops`);
  }

  async addRouteStop(routeId: string, dto: CreateRouteStopDTO): Promise<RouteStopDTO> {
    return httpClient.post(`/fleet/routes/${routeId}/stops`, dto);
  }
}

export const routeService = new RouteService();
