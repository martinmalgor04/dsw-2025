import { useEffect, useState, useRef } from 'react';
import { configStore } from '../config.store';
import type { ConfigState } from '../config.store';
import type { CreateTransportMethodDTO, UpdateTransportMethodDTO, CreateCoverageZoneDTO, UpdateCoverageZoneDTO } from '../../services/config.service';
import type { CreateTariffConfigDTO, UpdateTariffConfigDTO } from '../../services/tariff-config.service';

export function useConfig() {
  const [state, setState] = useState<ConfigState>({
    transportMethods: [],
    coverageZones: [],
    tariffConfigs: [],
    isLoading: false,
    error: null,
    lastSync: null,
  });

  const initialized = useRef(false);

  useEffect(() => {
    // Evitar cargas duplicadas (StrictMode en desarrollo)
    if (initialized.current) return;
    initialized.current = true;

    const unsub = configStore.subscribe(setState);
    configStore.loadTransportMethods();
    configStore.loadCoverageZones();
    configStore.loadTariffConfigs();
    return () => unsub();
  }, []);

  return {
    ...state,
    refresh: () => {
      configStore.loadTransportMethods(true);
      configStore.loadCoverageZones(true);
      configStore.loadTariffConfigs(true);
    },
    // Transport Methods actions
    createTransportMethod: (dto: CreateTransportMethodDTO) => configStore.createTransportMethod(dto),
    updateTransportMethod: (id: string, dto: UpdateTransportMethodDTO) => configStore.updateTransportMethod(id, dto),
    deleteTransportMethod: (id: string) => configStore.deleteTransportMethod(id),
    loadTransportMethods: (force?: boolean) => configStore.loadTransportMethods(force),
    // Coverage Zones actions
    createCoverageZone: (dto: CreateCoverageZoneDTO) => configStore.createCoverageZone(dto),
    updateCoverageZone: (id: string, dto: UpdateCoverageZoneDTO) => configStore.updateCoverageZone(id, dto),
    loadCoverageZones: (force?: boolean) => configStore.loadCoverageZones(force),
    // Tariff Configs actions
    createTariffConfig: (dto: CreateTariffConfigDTO) => configStore.createTariffConfig(dto),
    updateTariffConfig: (id: string, dto: UpdateTariffConfigDTO) => configStore.updateTariffConfig(id, dto),
    deleteTariffConfig: (id: string) => configStore.deleteTariffConfig(id),
    loadTariffConfigs: (force?: boolean) => configStore.loadTariffConfigs(force),
  };
}
