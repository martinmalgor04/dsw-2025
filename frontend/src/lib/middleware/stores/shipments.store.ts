import { shipmentService, ShipmentDTO, ShipmentFilters, CreateShipmentDTO, UpdateShipmentDTO } from '../services/shipment.service';

export interface PaginationState { page: number; pageSize: number; }

export interface ShipmentsState {
  items: ShipmentDTO[];
  selected: ShipmentDTO | null;
  filters: ShipmentFilters;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  total?: number;
}

let state: ShipmentsState = {
  items: [],
  selected: null,
  filters: {},
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10 },
  total: undefined,
};

const subs: Array<(s: ShipmentsState) => void> = [];
const notify = () => subs.forEach((fn) => fn(state));

export const shipmentsStore = {
  subscribe(fn: (s: ShipmentsState) => void) { subs.push(fn); fn(state); return () => { const i = subs.indexOf(fn); if (i>=0) subs.splice(i,1); }; },
  setLoading(v: boolean) { state = { ...state, isLoading: v }; notify(); },
  setError(e: string | null) { state = { ...state, error: e }; notify(); },
  setFilters(f: ShipmentFilters) { state = { ...state, filters: f }; notify(); },
  setPage(page: number) { state = { ...state, pagination: { ...state.pagination, page } }; notify(); },
  async load() {
    this.setLoading(true);
    try { state = { ...state, items: await shipmentService.getShipments(state.filters) }; }
    catch (e: any) { this.setError(e?.message || 'Error cargando envíos'); }
    finally { this.setLoading(false); notify(); }
  },
  async select(id: string) {
    this.setLoading(true);
    try { state = { ...state, selected: await shipmentService.getShipment(id) }; }
    catch (e: any) { this.setError(e?.message || 'Error obteniendo envío'); }
    finally { this.setLoading(false); notify(); }
  },
  async create(dto: CreateShipmentDTO) {
    this.setLoading(true);
    try { await shipmentService.createShipment(dto); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error creando envío'); }
    finally { this.setLoading(false); }
  },
  async update(id: string, dto: UpdateShipmentDTO) {
    this.setLoading(true);
    try { await shipmentService.updateShipment(id, dto); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error actualizando envío'); }
    finally { this.setLoading(false); }
  },
  async remove(id: string) {
    this.setLoading(true);
    try { await shipmentService.deleteShipment(id); await this.load(); }
    catch (e: any) { this.setError(e?.message || 'Error eliminando envío'); }
    finally { this.setLoading(false); }
  },
};
