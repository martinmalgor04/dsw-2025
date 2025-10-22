import { driverService, DriverDTO, CreateDriverDTO, UpdateDriverDTO, DriverFilters } from '../services/driver.service';

export interface DriversState {
  items: DriverDTO[];
  selected: DriverDTO | null;
  filters: DriverFilters;
  isLoading: boolean;
  error: string | null;
}

let state: DriversState = {
  items: [],
  selected: null,
  filters: {},
  isLoading: false,
  error: null,
};

const subs: Array<(s: DriversState) => void> = [];
const notify = () => subs.forEach((fn) => fn(state));

export const driversStore = {
  subscribe(fn: (s: DriversState) => void) { subs.push(fn); fn(state); return () => { const i = subs.indexOf(fn); if (i>=0) subs.splice(i,1); }; },
  setLoading(v: boolean) { state = { ...state, isLoading: v }; notify(); },
  setError(e: string | null) { state = { ...state, error: e }; notify(); },
  setFilters(f: DriverFilters) { state = { ...state, filters: f }; notify(); },
  async load() {
    this.setLoading(true);
    try { state = { ...state, items: await driverService.getDrivers(state.filters) }; }
    catch (e: any) { this.setError(e?.message || 'Error cargando conductores'); }
    finally { this.setLoading(false); notify(); }
  },
  async select(id: string) {
    this.setLoading(true);
    try { state = { ...state, selected: await driverService.getDriver(id) }; }
    catch (e: any) { this.setError(e?.message || 'Error obteniendo conductor'); }
    finally { this.setLoading(false); notify(); }
  },
  async create(dto: CreateDriverDTO) {
    this.setLoading(true);
    try { await driverService.createDriver(dto); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error creando conductor'); }
    finally { this.setLoading(false); }
  },
  async update(id: string, dto: UpdateDriverDTO) {
    this.setLoading(true);
    try { await driverService.updateDriver(id, dto); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error actualizando conductor'); }
    finally { this.setLoading(false); }
  },
  async remove(id: string) {
    this.setLoading(true);
    try { await driverService.deleteDriver(id); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error eliminando conductor'); }
    finally { this.setLoading(false); }
  },
};
