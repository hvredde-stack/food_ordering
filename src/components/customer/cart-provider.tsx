"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Dish } from "@/lib/types";

export interface CartLine {
  dishId: string;
  name: string;
  price_cents: number;
  quantity: number;
  notes?: string;
}

interface CartState { lines: CartLine[] }

type Action =
  | { type: "add"; dish: Dish }
  | { type: "set"; dishId: string; quantity: number }
  | { type: "notes"; dishId: string; notes: string }
  | { type: "remove"; dishId: string }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState };

const STORAGE_KEY = "fo_cart_v1";

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const existing = state.lines.find((l) => l.dishId === action.dish.id);
      const lines = existing
        ? state.lines.map((l) =>
            l.dishId === action.dish.id ? { ...l, quantity: l.quantity + 1 } : l
          )
        : [
            ...state.lines,
            {
              dishId: action.dish.id,
              name: action.dish.name,
              price_cents: action.dish.price_cents,
              quantity: 1,
            },
          ];
      return { lines };
    }
    case "set": {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((l) => l.dishId !== action.dishId) };
      }
      return {
        lines: state.lines.map((l) =>
          l.dishId === action.dishId ? { ...l, quantity: action.quantity } : l
        ),
      };
    }
    case "notes":
      return {
        lines: state.lines.map((l) =>
          l.dishId === action.dishId ? { ...l, notes: action.notes } : l
        ),
      };
    case "remove":
      return { lines: state.lines.filter((l) => l.dishId !== action.dishId) };
    case "clear":
      return { lines: [] };
  }
}

interface CartContextValue {
  lines: CartLine[];
  totalCents: number;
  count: number;
  add: (dish: Dish) => void;
  set: (dishId: string, quantity: number) => void;
  setNotes: (dishId: string, notes: string) => void;
  remove: (dishId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      totalCents: state.lines.reduce((s, l) => s + l.price_cents * l.quantity, 0),
      count: state.lines.reduce((s, l) => s + l.quantity, 0),
      add: (dish) => dispatch({ type: "add", dish }),
      set: (dishId, quantity) => dispatch({ type: "set", dishId, quantity }),
      setNotes: (dishId, notes) => dispatch({ type: "notes", dishId, notes }),
      remove: (dishId) => dispatch({ type: "remove", dishId }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
