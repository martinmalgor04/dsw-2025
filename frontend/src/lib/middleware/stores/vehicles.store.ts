import { vehicleService, VehicleDTO, CreateVehicleDTO, UpdateVehicleDTO, VehicleFilters } from '../services/vehicle.service';

export interface VehiclesState {
  items: VehicleDTO[];
  selected: VehicleDTO | null;
  filters: VehicleFilters;
  isLoading: boolean;
  error: string | null;
}

let state: VehiclesState = {
  items: [],
  selected: null,
  filters: {},
  isLoading: false,
  error: null,
};

const subs: Array<(s: VehiclesState) => void> = [];
const notify = () => subs.forEach((fn) => fn(state));

export const vehiclesStore = {
  subscribe(fn: (s: VehiclesState) => void) { subs.push(fn); fn(state); return () => { const i = subs.indexOf(fn); if (i>=0) subs.splice(i,1); }; },
  setLoading(v: boolean) { state = { ...state, isLoading: v }; notify(); },
  setError(e: string | null) { state = { ...state, error: e }; notify(); },
  setFilters(f: VehicleFilters) { state = { ...state, filters: f }; notify(); },
  async load() {
    this.setLoading(true);
    try { state = { ...state, items: await vehicleService.getVehicles(state.filters) }; }
    catch (e: any) { this.setError(e?.message || 'Error cargando vehículos'); }
    finally { this.setLoading(false); notify(); }
  },
  async select(id: string) {
    this.setLoading(true);
    try { state = { ...state, selected: await vehicleService.getVehicle(id) }; }
    catch (e: any) { this.setError(e?.message || 'Error obteniendo vehículo'); }
    finally { this.setLoading(false); notify(); }
  },
  async create(dto: CreateVehicleDTO) {
    this.setLoading(true);
    try { await vehicleService.createVehicle(dto); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error creando vehículo'); }
    finally { this.setLoading(false); }
  },
  async update(id: string, dto: UpdateVehicleDTO) {
    this.setLoading(true);
    try { await vehicleService.updateVehicle(id, dto); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error actualizando vehículo'); }
    finally { this.setLoading(false); }
  },
  async remove(id: string) {
    this.setLoading(true);
    try { await vehicleService.deleteVehicle(id); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error eliminando vehículo'); }
    finally { this.setLoading(false); }
  },
};
