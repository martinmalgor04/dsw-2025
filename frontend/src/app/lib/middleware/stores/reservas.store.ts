import {
  stockService,
  type StockReserva,
  type StockReservaEstado,
} from '../services/stock.service';

export interface ReservasState {
  items: StockReserva[];
  isLoading: boolean;
  error: string | null;
  updatingId: number | null;
  lastUpdatedAt: Date | null;
}

let state: ReservasState = {
  items: [],
  isLoading: false,
  error: null,
  updatingId: null,
  lastUpdatedAt: null,
};

const subscribers: Array<(state: ReservasState) => void> = [];
const notify = () => subscribers.forEach((fn) => fn(state));

export const reservasStore = {
  subscribe(fn: (s: ReservasState) => void) {
    subscribers.push(fn);
    fn(state);
    return () => {
      const idx = subscribers.indexOf(fn);
      if (idx >= 0) subscribers.splice(idx, 1);
    };
  },

  setLoading(value: boolean) {
    state = { ...state, isLoading: value };
    notify();
  },

  setError(error: string | null) {
    state = { ...state, error };
    notify();
  },

  setUpdating(id: number | null) {
    state = { ...state, updatingId: id };
    notify();
  },

  async load() {
    this.setLoading(true);
    this.setError(null);
    try {
      const reservas = await stockService.listReservas();
      state = {
        ...state,
        items: reservas,
        lastUpdatedAt: new Date(),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las reservas';
      this.setError(message);
    } finally {
      this.setLoading(false);
      notify();
    }
  },

  async changeEstado(
    reservaId: number,
    usuarioId: number,
    estado: StockReservaEstado,
  ) {
    this.setUpdating(reservaId);
    this.setError(null);
    try {
      const updated = await stockService.updateReservaEstado(
        reservaId,
        usuarioId,
        estado,
      );
      state = {
        ...state,
        items: state.items.map((item) =>
          item.idReserva === reservaId ? updated : item,
        ),
        lastUpdatedAt: new Date(),
      };
      notify();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la reserva';
      this.setError(message);
      throw error;
    } finally {
      this.setUpdating(null);
    }
  },

  async cancel(
    reservaId: number,
    motivo: string,
  ) {
    this.setUpdating(reservaId);
    this.setError(null);
    try {
      await stockService.cancelReserva(reservaId, motivo);
      await this.load();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo cancelar la reserva';
      this.setError(message);
      throw error;
    } finally {
      this.setUpdating(null);
    }
  },

  clearError() {
    this.setError(null);
  },
};

