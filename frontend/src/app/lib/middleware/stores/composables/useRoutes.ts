import { useEffect, useState } from 'react';
import { routesStore } from '../routes.store';
import type { RoutesState } from '../routes.store';
import type { CreateRouteDTO, UpdateRouteDTO } from '../../services/route.service';

export function useRoutes() {
  const [state, setState] = useState<RoutesState>({
    items: [],
    selected: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const unsub = routesStore.subscribe(setState);
    routesStore.load();
    return () => unsub();
  }, []);

  return {
    ...state,
    refresh: () => routesStore.load(),
    select: (id: string) => routesStore.select(id),
    create: (dto: CreateRouteDTO) => routesStore.create(dto),
    update: (id: string, dto: UpdateRouteDTO) => routesStore.update(id, dto),
    remove: (id: string) => routesStore.remove(id),
  };
}
