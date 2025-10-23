import { routeService, RouteDTO, CreateRouteDTO, UpdateRouteDTO } from '../services/route.service';

export interface RoutesState {
  items: RouteDTO[];
  selected: RouteDTO | null;
  isLoading: boolean;
  error: string | null;
}

let state: RoutesState = {
  items: [],
  selected: null,
  isLoading: false,
  error: null,
};

const subs: Array<(s: RoutesState) => void> = [];
const notify = () => subs.forEach((fn) => fn(state));

export const routesStore = {
  subscribe(fn: (s: RoutesState) => void) {
    subs.push(fn);
    fn(state);
    return () => {
      const i = subs.indexOf(fn);
      if (i >= 0) subs.splice(i, 1);
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
  async load() {
    this.setLoading(true);
    try {
      state = { ...state, items: await routeService.getRoutes() };
    } catch (e: any) {
      this.setError(e?.message || 'Error cargando rutas');
    } finally {
      this.setLoading(false);
      notify();
    }
  },
  async select(id: string) {
    this.setLoading(true);
    try {
      state = { ...state, selected: await routeService.getRoute(id) };
    } catch (e: any) {
      this.setError(e?.message || 'Error obteniendo ruta');
    } finally {
      this.setLoading(false);
      notify();
    }
  },
  async create(dto: CreateRouteDTO) {
    this.setLoading(true);
    try {
      await routeService.createRoute(dto);
      await this.load();
    } catch (e: any) {
      this.setError(e?.message || 'Error creando ruta');
    } finally {
      this.setLoading(false);
    }
  },
  async update(id: string, dto: UpdateRouteDTO) {
    this.setLoading(true);
    try {
      await routeService.updateRoute(id, dto);
      await this.load();
    } catch (e: any) {
      this.setError(e?.message || 'Error actualizando ruta');
    } finally {
      this.setLoading(false);
    }
  },
  async remove(id: string) {
    this.setLoading(true);
    try {
      await routeService.deleteRoute(id);
      await this.load();
    } catch (e: any) {
      this.setError(e?.message || 'Error eliminando ruta');
    } finally {
      this.setLoading(false);
    }
  },
};
