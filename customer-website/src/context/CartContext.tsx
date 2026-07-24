import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode,
} from 'react';
import { v4 as uuid } from 'uuid';
import type { CartItem, Product, ProductVariant, LensConfiguration, PriceBreakdown } from '../types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD':
      return { items: [...state.items, action.item] };
    case 'REMOVE':
      return { items: state.items.filter((i) => i.id !== action.id) };
    case 'UPDATE_QTY':
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: Math.max(1, action.quantity) } : i,
        ),
      };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addToCart: (
    product: Product,
    variant: ProductVariant,
    quantity?: number,
    configurationSnapshot?: { lensConfig: LensConfiguration; priceBreakdown: PriceBreakdown; }
  ) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId: string) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'ao_cart';

function loadFromStorage(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartState) : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addToCart = useCallback(
    (
      product: Product,
      variant: ProductVariant,
      quantity = 1,
      configurationSnapshot?: { lensConfig: LensConfiguration; priceBreakdown: PriceBreakdown; }
    ) => {
      dispatch({
        type: 'ADD',
        item: { id: uuid(), product, variant, quantity, configurationSnapshot },
      });
    },
    [],
  );

  const removeFromCart = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);
  const updateQuantity = useCallback(
    (id: string, quantity: number) => dispatch({ type: 'UPDATE_QTY', id, quantity }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const isInCart = useCallback(
    (productId: string, variantId: string) =>
      state.items.some((i) => i.product.id === productId && i.variant.id === variantId),
    [state.items],
  );

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => {
      // If there is a configuration snapshot with a subtotal, use it. Otherwise fallback to base product price.
      const unitPrice = i.configurationSnapshot ? i.configurationSnapshot.priceBreakdown.subtotal : i.product.price;
      return sum + unitPrice * i.quantity;
    }, 0),
    [state.items],
  );

  const value: CartContextValue = useMemo(
    () => ({
      items: state.items,
      totalItems: state.items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
    }),
    [state.items, subtotal, addToCart, removeFromCart, updateQuantity, clearCart, isInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}