import { useEffect, useState } from 'react';
import {
  productsStore,
  type ProductsState,
} from '../../stores/products.store';

const initialState: ProductsState = {
  items: [],
  isLoading: false,
  error: null,
  lastUpdatedAt: null,
};

export function useProductos() {
  const [state, setState] = useState<ProductsState>(initialState);

  useEffect(() => {
    const unsubscribe = productsStore.subscribe(setState);
    productsStore.load();
    return () => unsubscribe();
  }, []);

  return {
    ...state,
    refresh: () => productsStore.load(),
    clearError: () => productsStore.setError(null),
  };
}

