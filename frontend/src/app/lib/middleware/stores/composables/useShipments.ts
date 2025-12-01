import { useEffect, useState } from 'react';
import { shipmentsStore } from '../shipments.store';
import type { ShipmentsState } from '../shipments.store';
import type { CreateShipmentDTO, UpdateShipmentDTO, ProductDTO, AddressDTO, ShipmentFilters } from '../../services/shipment.service';

export function useShipments() {
  const [state, setState] = useState<ShipmentsState>({
    items: [],
    selected: null,
    filters: {},
    isLoading: false,
    isQuoting: false,
    quoteResult: null,
    error: null,
    pagination: { page: 1, pageSize: 10 },
    total: undefined,
  });

  useEffect(() => {
    const unsub = shipmentsStore.subscribe(setState);
    shipmentsStore.load();
    return () => unsub();
  }, []);

  return {
    ...state,
    refresh: () => shipmentsStore.load(),
    select: (id: string) => shipmentsStore.select(id),
    create: (dto: CreateShipmentDTO) => shipmentsStore.create(dto),
    update: (id: string, dto: UpdateShipmentDTO) => shipmentsStore.update(id, dto),
    remove: (id: string) => shipmentsStore.remove(id),
    setFilters: (f: ShipmentFilters) => shipmentsStore.setFilters(f),
    quote: (delivery_address: AddressDTO, products: ProductDTO[]) => shipmentsStore.quote(delivery_address, products),
  };
}
