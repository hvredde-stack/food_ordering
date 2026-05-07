"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Dish, PriceUnit } from "@/lib/types";
import { defaultWeight, lineTotalCents } from "@/lib/weight";

// CartLine carries the unit alongside quantity so weight-priced items
// (1.5 lb fish pakora) and each-priced items (2 dosas) share a single
// data shape. The line total is always price_cents * quantity, which is
// correct for both because price_cents IS the per-unit price for weight
// dishes and the per-item price for each dishes.
export interface CartLine {
  dishId: string;
  name: string;
  price_cents: number;
  /** Decimal for weight units, integer for "each". */
  quantity: number;
  unit: PriceUnit;
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

// Bumped from v1 to v2 because the CartLine shape gained a `unit` field.
// Old persisted carts will hydrate as v1, miss the field, and silently
// recover by treating everything as "each" — but rather than ship that
// risk we just expire the old key entirely.
const STORAGE_KEY = "ts_cart_v2";

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const existing = state.lines.find((l) => l.dishId === action.dish.id);
      const unit = (action.dish.price_unit ?? "each") as PriceUnit;
      const startingQty = unit === "each" ? 1 : defaultWeight(unit);
      const lines = existing
        ? state.lines.map((l) =>
            l.dishId === action.dish.id
              // For "each" we add 1 more on each tap. For weight dishes
              // tapping Add again is a no-op — they pick a chip instead.
              ? { ...l, quantity: unit === "each" ? l.quantity + 1 : l.quantity }
              : l
          )
        : [
            ...state.lines,
            {
              dishId: action.dish.id,
              name: action.dish.name,
              price_cents: action.dish.price_cents,
              quantity: startingQty,
              unit,
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
  /** Number of distinct lines (NOT sum of quantities — which would be
   *  meaningless when mixing 2 dosas with 1.5 lb of pakora). */
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
      totalCents: state.lines.reduce(
        (s, l) => s + lineTotalCents(l.price_cents, l.quantity),
        0
      ),
      // Show "1 item" / "3 items" by line count — mixing eaches with lb
      // makes a sum of quantities nonsensical.
      count: state.lines.length,
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
