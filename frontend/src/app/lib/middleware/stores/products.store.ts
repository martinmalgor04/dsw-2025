import { stockService, type StockProduct } from '../services/stock.service';

export interface ProductsState {
  items: StockProduct[];
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: Date | null;
}

let state: ProductsState = {
  items: [],
  isLoading: false,
  error: null,
  lastUpdatedAt: null,
};

const subscribers: Array<(state: ProductsState) => void> = [];

const notify = () => subscribers.forEach((fn) => fn(state));

export const productsStore = {
  subscribe(fn: (s: ProductsState) => void) {
    subscribers.push(fn);
    fn(state);
    return () => {
      const idx = subscribers.indexOf(fn);
      if (idx >= 0) {
        subscribers.splice(idx, 1);
      }
    };
  },

  setLoading(isLoading: boolean) {
    state = { ...state, isLoading };
    notify();
  },

  setError(error: string | null) {
    state = { ...state, error };
    notify();
  },

  async load() {
    this.setLoading(true);
    this.setError(null);
    try {
      const products = await stockService.listProducts();
      state = { ...state, items: products, lastUpdatedAt: new Date() };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los productos';
      this.setError(message);
    } finally {
      this.setLoading(false);
      notify();
    }
  },
};

