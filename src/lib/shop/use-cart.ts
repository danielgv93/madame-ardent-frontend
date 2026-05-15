import { useSyncExternalStore } from 'react';
import { cartStore, type CartState } from './cart-store';

function getServerSnapshot(): CartState {
  return { items: {}, currency: 'EUR' };
}

export function useCart(): CartState {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, getServerSnapshot);
}
