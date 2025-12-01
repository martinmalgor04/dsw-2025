import { useEffect, useState } from 'react';
import { vehiclesStore } from '../vehicles.store';
import type { VehiclesState } from '../vehicles.store';
import type { CreateVehicleDTO, UpdateVehicleDTO, VehicleFilters } from '../../services/vehicle.service';

export function useVehicles() {
  const [state, setState] = useState<VehiclesState>({
    items: [],
    selected: null,
    filters: {},
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const unsub = vehiclesStore.subscribe(setState);
    vehiclesStore.load();
    return () => unsub();
  }, []);

  return {
    ...state,
    refresh: () => vehiclesStore.load(),
    select: (id: string) => vehiclesStore.select(id),
    create: (dto: CreateVehicleDTO) => vehiclesStore.create(dto),
    update: (id: string, dto: UpdateVehicleDTO) => vehiclesStore.update(id, dto),
    remove: (id: string) => vehiclesStore.remove(id),
    setFilters: (f: VehicleFilters) => vehiclesStore.setFilters(f),
  };
}
