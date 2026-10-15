/**
 * Cart store — simple React Context + useReducer approach.
 * No external state library required; keeps bundle lean.
 */
import React, { createContext, useCallback, useContext, useReducer } from 'react';

import { CartItem, FoodItem, PortionOption, SwallowOption } from '@/types';

// ─── State ────────────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  promoCode: string;
  promoDiscount: number;
  deliveryFee: number;
  packagingFee: number;
}

const INITIAL_STATE: CartState = {
  items: [],
  promoCode: '',
  promoDiscount: 0,
  deliveryFee: 1200,
  packagingFee: 600,
};

// ─── Actions ──────────────────────────────────────────────────────────────────
type CartAction =
  | {
      type: 'ADD_ITEM';
      food: FoodItem;
      quantity: number;
      selectedSwallow?: SwallowOption;
      selectedPortion?: PortionOption;
    }
  | { type: 'REMOVE_ITEM'; foodId: string }
  | { type: 'INCREMENT'; foodId: string }
  | { type: 'DECREMENT'; foodId: string }
  | { type: 'APPLY_PROMO'; code: string; discount: number }
  | { type: 'CLEAR_CART' };

function resolveUnitPrice(food: FoodItem, portion?: PortionOption): number {
  return portion ? portion.price : food.basePrice;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex((i) => i.food.id === action.food.id);
      const unitPrice = resolveUnitPrice(action.food, action.selectedPortion);
      if (existing >= 0) {
        const updated = [...state.items];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + action.quantity,
          selectedSwallow: action.selectedSwallow ?? updated[existing].selectedSwallow,
          selectedPortion: action.selectedPortion ?? updated[existing].selectedPortion,
          unitPrice,
        };
        return { ...state, items: updated };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            food: action.food,
            quantity: action.quantity,
            selectedSwallow: action.selectedSwallow,
            selectedPortion: action.selectedPortion,
            unitPrice,
          },
        ],
      };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.food.id !== action.foodId) };

    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.food.id === action.foodId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };

    case 'DECREMENT':
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.food.id === action.foodId ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0),
      };

    case 'APPLY_PROMO':
      return { ...state, promoCode: action.code, promoDiscount: action.discount };

    case 'CLEAR_CART':
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface CartContextValue {
  state: CartState;
  addItem: (
    food: FoodItem,
    quantity?: number,
    selectedSwallow?: SwallowOption,
    selectedPortion?: PortionOption
  ) => void;
  removeItem: (foodId: string) => void;
  increment: (foodId: string) => void;
  decrement: (foodId: string) => void;
  applyPromo: (code: string, discount: number) => void;
  clearCart: () => void;
  // Derived
  itemCount: number;
  subtotal: number;
  total: number;
  getQuantity: (foodId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE);

  const addItem = useCallback(
    (
      food: FoodItem,
      quantity = 1,
      selectedSwallow?: SwallowOption,
      selectedPortion?: PortionOption
    ) => dispatch({ type: 'ADD_ITEM', food, quantity, selectedSwallow, selectedPortion }),
    []
  );

  const removeItem = useCallback(
    (foodId: string) => dispatch({ type: 'REMOVE_ITEM', foodId }),
    []
  );
  const increment = useCallback(
    (foodId: string) => dispatch({ type: 'INCREMENT', foodId }),
    []
  );
  const decrement = useCallback(
    (foodId: string) => dispatch({ type: 'DECREMENT', foodId }),
    []
  );
  const applyPromo = useCallback(
    (code: string, discount: number) => dispatch({ type: 'APPLY_PROMO', code, discount }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total =
    subtotal + state.deliveryFee + state.packagingFee - state.promoDiscount;

  const getQuantity = useCallback(
    (foodId: string) => state.items.find((i) => i.food.id === foodId)?.quantity ?? 0,
    [state.items]
  );

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        increment,
        decrement,
        applyPromo,
        clearCart,
        itemCount,
        subtotal,
        total,
        getQuantity,
      }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
