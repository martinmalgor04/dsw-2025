import {
  shipmentService,
  ShipmentDTO,
  ShipmentFilters,
  CreateShipmentDTO,
  UpdateShipmentDTO,
  CalculateCostResponseDTO,
  ProductDTO,
  AddressDTO,
} from '../services/shipment.service';

export interface PaginationState { page: number; pageSize: number; }

export interface ShipmentsState {
  items: ShipmentDTO[];
  selected: ShipmentDTO | null;
  filters: ShipmentFilters;
  isLoading: boolean;
  isQuoting: boolean; // Estado de carga para la cotización
  quoteResult: CalculateCostResponseDTO | null; // Resultado de la cotización
  error: string | null;
  pagination: PaginationState;
  total?: number;
}

let state: ShipmentsState = {
  items: [],
  selected: null,
  filters: {},
  isLoading: false,
  isQuoting: false,
  quoteResult: null,
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
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error cargando envíos';
      this.setError(message);
    }
    finally { this.setLoading(false); notify(); }
  },
  async select(id: string) {
    this.setLoading(true);
    try { state = { ...state, selected: await shipmentService.getShipment(id) }; }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error obteniendo envío';
      this.setError(message);
    }
    finally { this.setLoading(false); notify(); }
  },
  async create(dto: CreateShipmentDTO) {
    this.setLoading(true);
    try { await shipmentService.createShipment(dto); await this.load(); }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error creando envío';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  async update(id: string, dto: UpdateShipmentDTO) {
    this.setLoading(true);
    try { await shipmentService.updateShipment(id, dto); await this.load(); }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error actualizando envío';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  async remove(id: string) {
    this.setLoading(true);
    try { await shipmentService.deleteShipment(id); await this.load(); }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error eliminando envío';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  async quote(delivery_address: AddressDTO, products: ProductDTO[]) {
    state = { ...state, isQuoting: true, error: null, quoteResult: null };
    notify();
    try {
      const result = await shipmentService.calculateQuote(delivery_address, products);
      state = { ...state, quoteResult: result };
      notify();
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al calcular la cotización';
      this.setError(message);
    }
    finally {
      state = { ...state, isQuoting: false };
      notify();
    }
  },
};
