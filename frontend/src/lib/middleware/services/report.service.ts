import { httpClient } from '../http/http-client';

export interface DateRange { from?: string; to?: string }

export interface DashboardMetrics {
  shipmentsToday: number;
  shipmentsInTransit: number;
  averageDeliveryTime: number; // horas
  vehiclesAvailable: number;
}

export interface ShipmentMetrics {
  byStatus: Record<string, number>;
  byTransportMethod: Record<string, number>;
  averageCost: number;
}

export interface VehicleUtilization {
  vehicleId: string;
  utilizationPct: number;
}

export interface DriverPerformance {
  driverId: string;
  deliveries: number;
  onTimePct: number;
}

export interface RouteEfficiency {
  routeId: string;
  distanceKm: number;
  timeHours: number;
}

export type ReportType = 'shipments' | 'vehicles' | 'drivers' | 'routes';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

class ReportService {
  async getDashboardMetrics(period?: DateRange): Promise<DashboardMetrics> {
    return httpClient.get('/reports/dashboard', { params: period });
  }

  async getShipmentMetrics(period?: DateRange): Promise<ShipmentMetrics> {
    return httpClient.get('/reports/shipments', { params: period });
  }

  async getVehicleUtilization(period?: DateRange): Promise<VehicleUtilization[]> {
    return httpClient.get('/reports/vehicles/utilization', { params: period });
  }

  async getDriverPerformance(driverId?: string): Promise<DriverPerformance[]> {
    return httpClient.get('/reports/drivers/performance', { params: { driverId } });
  }

  async getRouteEfficiency(period?: DateRange): Promise<RouteEfficiency[]> {
    return httpClient.get('/reports/routes/efficiency', { params: period });
  }

  async exportReport(type: ReportType, format: ExportFormat): Promise<Blob> {
    const data = await httpClient.post<ArrayBuffer>(`/reports/export`, { type, format }, { responseType: 'arraybuffer' });
    return new Blob([data]);
  }
}

export const reportService = new ReportService();
