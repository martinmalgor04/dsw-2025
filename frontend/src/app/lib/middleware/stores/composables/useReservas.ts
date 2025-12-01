import { useEffect, useState } from 'react';
import {
  reservasStore,
  type ReservasState,
} from '../../stores/reservas.store';
import type { StockReservaEstado } from '../../services/stock.service';

const initialState: ReservasState = {
  items: [],
  isLoading: false,
  error: null,
  updatingId: null,
  lastUpdatedAt: null,
};

export function useReservas() {
  const [state, setState] = useState<ReservasState>(initialState);

  useEffect(() => {
    const unsubscribe = reservasStore.subscribe(setState);
    reservasStore.load();
    return () => unsubscribe();
  }, []);

  return {
    ...state,
    refresh: () => reservasStore.load(),
    clearError: () => reservasStore.clearError(),
    setError: (message: string | null) => reservasStore.setError(message),
    changeEstado: (
      idReserva: number,
      usuarioId: number,
      estado: StockReservaEstado,
    ) => reservasStore.changeEstado(idReserva, usuarioId, estado),
    cancelarReserva: (idReserva: number, motivo: string) =>
      reservasStore.cancel(idReserva, motivo),
  };
}

