import { useEffect, useState } from 'react';
import { driversStore } from '../drivers.store';
import type { DriversState } from '../drivers.store';
import type { CreateDriverDTO, UpdateDriverDTO, DriverFilters } from '../../services/driver.service';

export function useDrivers() {
  const [state, setState] = useState<DriversState>({
    items: [],
    selected: null,
    filters: {},
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const unsub = driversStore.subscribe(setState);
    driversStore.load();
    return () => unsub();
  }, []);

  return {
    ...state,
    refresh: () => driversStore.load(),
    select: (id: string) => driversStore.select(id),
    create: (dto: CreateDriverDTO) => driversStore.create(dto),
    update: (id: string, dto: UpdateDriverDTO) => driversStore.update(id, dto),
    remove: (id: string) => driversStore.remove(id),
    setFilters: (f: DriverFilters) => driversStore.setFilters(f),
  };
}
