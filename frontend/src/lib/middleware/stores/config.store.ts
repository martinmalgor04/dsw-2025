import { configService, CoverageZone, TransportMethod } from '../services/config.service';

export interface ConfigState {
  transportMethods: TransportMethod[];
  coverageZones: CoverageZone[];
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
}

let state: ConfigState = {
  transportMethods: [],
  coverageZones: [],
  isLoading: false,
  error: null,
  lastSync: null,
};

const subscribers: Array<(s: ConfigState) => void> = [];

function notify() { subscribers.forEach((s) => s(state)); }

export const configStore = {
  subscribe(fn: (s: ConfigState) => void) {
    subscribers.push(fn); fn(state); return () => {
      const i = subscribers.indexOf(fn); if (i >= 0) subscribers.splice(i, 1);
    };
  },
  setLoading(v: boolean) { state = { ...state, isLoading: v }; notify(); },
  setError(e: string | null) { state = { ...state, error: e }; notify(); },
  setTransportMethods(list: TransportMethod[]) { state = { ...state, transportMethods: list, lastSync: Date.now() }; notify(); },
  setCoverageZones(list: CoverageZone[]) { state = { ...state, coverageZones: list, lastSync: Date.now() }; notify(); },
  async loadTransportMethods(force = false) {
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.transportMethods.length) return;
    this.setLoading(true);
    try { this.setTransportMethods(await configService.getTransportMethods()); }
    catch (e: any) { this.setError(e?.message || 'Error cargando métodos'); }
    finally { this.setLoading(false); }
  },
  async loadCoverageZones(force = false) {
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.coverageZones.length) return;
    this.setLoading(true);
    try { this.setCoverageZones(await configService.getCoverageZones()); }
    catch (e: any) { this.setError(e?.message || 'Error cargando zonas'); }
    finally { this.setLoading(false); }
  },
};
