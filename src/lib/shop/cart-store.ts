import type { Currency } from './currency';
import { SUPPORTED_CURRENCIES } from './currency';

export interface CartState {
  items: Record<string, number>;
  currency: Currency;
}

const STORAGE_KEY = 'ma:cart';
const DEFAULT_STATE: CartState = { items: {}, currency: 'EUR' };

type Listener = (state: CartState) => void;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readFromStorage(): CartState {
  if (!isBrowser()) return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<CartState>;
    const items: Record<string, number> = {};
    if (parsed.items && typeof parsed.items === 'object') {
      for (const [slug, qty] of Object.entries(parsed.items)) {
        if (typeof qty === 'number' && qty > 0 && Number.isFinite(qty)) {
          items[slug] = Math.floor(qty);
        }
      }
    }
    const currency: Currency =
      typeof parsed.currency === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(parsed.currency)
        ? (parsed.currency as Currency)
        : DEFAULT_STATE.currency;
    return { items, currency };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeToStorage(state: CartState): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or disabled — silent fail
  }
}

let state: CartState = readFromStorage();
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l(state);
}

function setState(next: CartState): void {
  state = next;
  writeToStorage(state);
  emit();
}

export const cartStore = {
  getSnapshot(): CartState {
    return state;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  addItem(slug: string, quantity = 1): void {
    const current = state.items[slug] ?? 0;
    setState({ ...state, items: { ...state.items, [slug]: current + quantity } });
  },
  setQuantity(slug: string, quantity: number): void {
    const next = { ...state.items };
    if (quantity <= 0) {
      delete next[slug];
    } else {
      next[slug] = Math.floor(quantity);
    }
    setState({ ...state, items: next });
  },
  removeItem(slug: string): void {
    if (!(slug in state.items)) return;
    const next = { ...state.items };
    delete next[slug];
    setState({ ...state, items: next });
  },
  clear(): void {
    setState({ ...state, items: {} });
  },
  setCurrency(currency: Currency): void {
    if (state.currency === currency) return;
    setState({ ...state, currency });
  },
  totalItems(): number {
    let total = 0;
    for (const q of Object.values(state.items)) total += q;
    return total;
  },
};

// Cross-tab sync
if (isBrowser()) {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = readFromStorage();
    emit();
  });
}
