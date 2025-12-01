import { reportService, KPIData, DateRange } from '../services/report.service';
import { generateMockKPIData } from '../services/mock-kpi-data';

export interface ReportsState {
  kpiData: KPIData | null;
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
  currentPeriod: DateRange | null;
  autoRefresh: boolean;
}

let state: ReportsState = {
  kpiData: null,
  isLoading: false,
  error: null,
  lastSync: null,
  currentPeriod: null,
  autoRefresh: false,
};

const subscribers: Array<(s: ReportsState) => void> = [];
let notifyScheduled = false;

function notify() {
  // Encolar notificaciones en microtask para evitar updates infinitos
  if (notifyScheduled) return;
  notifyScheduled = true;

  Promise.resolve().then(() => {
    notifyScheduled = false;
    const currentSubscribers = [...subscribers];
    currentSubscribers.forEach((s) => s(state));
  });
}

// Flags para evitar cargas concurrentes
let kpiLoading = false;

// Timestamps para evitar reintentos muy rápidos después de errores
let lastKpiError = 0;
const ERROR_RETRY_DELAY = 5000; // 5 segundos mínimo entre reintentos

export const reportsStore = {
  subscribe(fn: (s: ReportsState) => void) {
    subscribers.push(fn);
    return () => {
      const i = subscribers.indexOf(fn);
      if (i >= 0) subscribers.splice(i, 1);
    };
  },

  setLoading(v: boolean) {
    state = { ...state, isLoading: v };
    notify();
  },

  setError(e: string | null) {
    state = { ...state, error: e };
    notify();
  },

  setKPIData(data: KPIData) {
    state = { ...state, kpiData: data, lastSync: Date.now() };
    notify();
  },

  setPeriod(period: DateRange | null) {
    state = { ...state, currentPeriod: period };
    notify();
  },

  setAutoRefresh(enabled: boolean) {
    state = { ...state, autoRefresh: enabled };
    notify();
  },

  async loadKPIs(period?: DateRange, force = false) {
    // Evitar cargas concurrentes
    if (kpiLoading) return;

    // Cache check: no recargar si ya tenemos datos y no pasó mucho tiempo (5 minutos)
    if (!force && state.lastSync && Date.now() - state.lastSync < 5 * 60 * 1000 && state.kpiData) return;

    // Si hubo un error reciente, no reintentar hasta que pasen 5 segundos
    if (!force && Date.now() - lastKpiError < ERROR_RETRY_DELAY) return;

    kpiLoading = true;
    this.setLoading(true);
    this.setError(null);

    try {
      const data = await reportService.getKPIs(period);
      this.setKPIData(data);
      this.setPeriod(period || null);
    } catch (e: unknown) {
      lastKpiError = Date.now();
      console.warn('KPI API error, using mock data:', e);

      // Use mock data for development/demo when backend is not available
      const mockData = generateMockKPIData();
      this.setKPIData(mockData);
      this.setPeriod(period || null);

      // Don't set error in this case, as we're using mock data
      // const message = e instanceof Error ? e.message : 'Error cargando KPIs';
      // this.setError(message);
    } finally {
      this.setLoading(false);
      kpiLoading = false;
    }
  },

  async exportToCSV() {
    if (!state.kpiData) {
      throw new Error('No hay datos para exportar');
    }

    try {
      // Create CSV content
      const csvRows = [];

      // Headers
      csvRows.push('Métrica,Valor');

      // Total shipments
      csvRows.push(`Envíos Hoy,${state.kpiData.totalShipments.today}`);
      csvRows.push(`Envíos Semana,${state.kpiData.totalShipments.week}`);
      csvRows.push(`Envíos Mes,${state.kpiData.totalShipments.month}`);

      // Success rate and avg time
      csvRows.push(`Tasa de Entrega Exitosa,${state.kpiData.deliverySuccessRate.toFixed(2)}%`);
      csvRows.push(`Tiempo Promedio de Entrega,${state.kpiData.averageDeliveryTime.toFixed(2)} horas`);

      csvRows.push(''); // Empty line

      // Status distribution
      csvRows.push('Estado,Cantidad');
      state.kpiData.shipmentsByStatus.forEach(item => {
        csvRows.push(`${item.status},${item.count}`);
      });

      csvRows.push(''); // Empty line

      // Transport types
      csvRows.push('Tipo de Transporte,Cantidad,Porcentaje');
      state.kpiData.transportTypeDistribution.forEach(item => {
        csvRows.push(`${item.type},${item.count},${item.percentage.toFixed(2)}%`);
      });

      csvRows.push(''); // Empty line

      // Top zones
      csvRows.push('Zona,Envíos');
      state.kpiData.topZones.forEach(item => {
        csvRows.push(`${item.zone},${item.shipments}`);
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `reporte-kpis-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error exportando a CSV';
      this.setError(message);
      throw e;
    }
  }
};
