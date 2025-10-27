import { configService, CoverageZone, TransportMethod, CreateTransportMethodDTO, UpdateTransportMethodDTO, CreateCoverageZoneDTO, UpdateCoverageZoneDTO } from '../services/config.service';
import { tariffConfigService, TariffConfigDTO, CreateTariffConfigDTO, UpdateTariffConfigDTO } from '../services/tariff-config.service';

export interface ConfigState {
  transportMethods: TransportMethod[];
  coverageZones: CoverageZone[];
  tariffConfigs: TariffConfigDTO[];
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
}

let state: ConfigState = {
  transportMethods: [],
  coverageZones: [],
  tariffConfigs: [],
  isLoading: false,
  error: null,
  lastSync: null,
};

const subscribers: Array<(s: ConfigState) => void> = [];

function notify() { subscribers.forEach((s) => s(state)); }

// Flags para evitar cargas concurrentes
let transportMethodsLoading = false;
let coverageZonesLoading = false;
let tariffConfigsLoading = false;

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
  setTariffConfigs(list: TariffConfigDTO[]) { state = { ...state, tariffConfigs: list, lastSync: Date.now() }; notify(); },
  async loadTransportMethods(force = false) {
    // Evitar cargas concurrentes
    if (transportMethodsLoading) return;

    // Cache check
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.transportMethods.length) return;

    transportMethodsLoading = true;
    this.setLoading(true);
    try {
      this.setTransportMethods(await configService.getTransportMethods());
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error cargando métodos';
      this.setError(message);
    }
    finally {
      this.setLoading(false);
      transportMethodsLoading = false;
    }
  },
  async loadCoverageZones(force = false) {
    // Evitar cargas concurrentes
    if (coverageZonesLoading) return;

    // Cache check
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.coverageZones.length) return;

    coverageZonesLoading = true;
    this.setLoading(true);
    try {
      this.setCoverageZones(await configService.getCoverageZones());
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error cargando zonas';
      this.setError(message);
    }
    finally {
      this.setLoading(false);
      coverageZonesLoading = false;
    }
  },
  
  // Transport Methods CRUD
  async createTransportMethod(dto: CreateTransportMethodDTO) {
    this.setLoading(true);
    try {
      const newMethod = await configService.createTransportMethod(dto);
      this.setTransportMethods([...state.transportMethods, newMethod]);
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error creando método de transporte';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  
  async updateTransportMethod(id: string, dto: UpdateTransportMethodDTO) {
    this.setLoading(true);
    try {
      const updatedMethod = await configService.updateTransportMethod(id, dto);
      this.setTransportMethods(state.transportMethods.map(method =>
        method.id === id ? updatedMethod : method
      ));
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error actualizando método de transporte';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  
  async deleteTransportMethod(id: string) {
    this.setLoading(true);
    try {
      await configService.deleteTransportMethod(id);
      this.setTransportMethods(state.transportMethods.filter(method => method.id !== id));
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error eliminando método de transporte';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  
  // Coverage Zones CRUD
  async createCoverageZone(dto: CreateCoverageZoneDTO) {
    this.setLoading(true);
    try {
      const newZone = await configService.createCoverageZone(dto);
      this.setCoverageZones([...state.coverageZones, newZone]);
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error creando zona de cobertura';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  
  async updateCoverageZone(id: string, dto: UpdateCoverageZoneDTO) {
    this.setLoading(true);
    try {
      const updatedZone = await configService.updateCoverageZone(id, dto);
      this.setCoverageZones(state.coverageZones.map(zone =>
        zone.id === id ? updatedZone : zone
      ));
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error actualizando zona de cobertura';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },

  // Tariff Configs CRUD
  async loadTariffConfigs(force = false) {
    // Evitar cargas concurrentes
    if (tariffConfigsLoading) return;

    // Cache check: no recargar si ya tenemos datos y no pasó mucho tiempo
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.tariffConfigs.length) return;

    tariffConfigsLoading = true;
    this.setLoading(true);
    try {
      this.setTariffConfigs(await tariffConfigService.getTariffConfigs());
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error cargando configuraciones de tarifa';
      this.setError(message);
    }
    finally {
      this.setLoading(false);
      tariffConfigsLoading = false;
    }
  },
  
  async createTariffConfig(dto: CreateTariffConfigDTO) {
    this.setLoading(true);
    try {
      const newConfig = await tariffConfigService.createTariffConfig(dto);
      this.setTariffConfigs([...state.tariffConfigs, newConfig]);
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error creando configuración de tarifa';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  
  async updateTariffConfig(id: string, dto: UpdateTariffConfigDTO) {
    this.setLoading(true);
    try {
      const updatedConfig = await tariffConfigService.updateTariffConfig(id, dto);
      this.setTariffConfigs(state.tariffConfigs.map(config =>
        config.id === id ? updatedConfig : config
      ));
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error actualizando configuración de tarifa';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  
  async deleteTariffConfig(id: string) {
    this.setLoading(true);
    try {
      await tariffConfigService.deleteTariffConfig(id);
      this.setTariffConfigs(state.tariffConfigs.filter(config => config.id !== id));
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error eliminando configuración de tarifa';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
};
