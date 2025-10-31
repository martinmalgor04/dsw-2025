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

function notify() { 
  // Solo notificar si hay suscriptores
  if (subscribers.length > 0) {
    subscribers.forEach((s) => s(state)); 
  }
}

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
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.transportMethods.length) return;
    this.setLoading(true);
    try { this.setTransportMethods(await configService.getTransportMethods()); }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error cargando métodos';
      this.setError(message);
    }
    finally { this.setLoading(false); }
  },
  async loadCoverageZones(force = false) {
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.coverageZones.length) return;
    this.setLoading(true);
    try { this.setCoverageZones(await configService.getCoverageZones()); }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error cargando zonas';
      this.setError(message);
    }
    finally { this.setLoading(false); }
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
    console.log('🏪 configStore.loadTariffConfigs: Iniciando...', { force, isLoading: state.isLoading });
    
    // No bloquear por isLoading global: este loader puede correr en paralelo
    if (!force && state.lastSync && Date.now() - state.lastSync < 15 * 60 * 1000 && state.tariffConfigs.length) {
      console.log('🏪 configStore.loadTariffConfigs: Datos recientes en cache, saliendo...');
      return;
    }
    
    console.log('🏪 configStore.loadTariffConfigs: Haciendo request a la API...');
    // No tocar isLoading global para no interferir con otros loaders
    this.setError(null);
    
    try { 
      const configs = await tariffConfigService.getTariffConfigs();
      console.log('🏪 configStore.loadTariffConfigs: Datos recibidos:', configs.length, 'configuraciones');
      this.setTariffConfigs(configs); 
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error cargando configuraciones de tarifa';
      console.error('🏪 configStore.loadTariffConfigs: Error:', message);
      this.setError(message);
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
