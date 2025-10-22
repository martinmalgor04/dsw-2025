import { useEffect, useState } from 'react';
import { configStore } from '../config.store';
import type { ConfigState } from '../config.store';

export function useConfig() {
  const [state, setState] = useState<ConfigState>({
    transportMethods: [],
    coverageZones: [],
    isLoading: false,
    error: null,
    lastSync: null,
  });

  useEffect(() => {
    const unsub = configStore.subscribe(setState);
    configStore.loadTransportMethods();
    configStore.loadCoverageZones();
    return () => unsub();
  }, []);

  return {
    ...state,
    refresh: () => {
      configStore.loadTransportMethods(true);
      configStore.loadCoverageZones(true);
    },
  };
}
