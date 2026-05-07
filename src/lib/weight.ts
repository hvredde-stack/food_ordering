// Helpers for weight-priced menu items. Centralised so the customer
// menu, cart, kitchen ticket, and admin orders display all format the
// same quantities the same way.

import type { PriceUnit } from "@/lib/types";

/** Verbose label shown to owners when picking the unit for a dish. */
export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  each: "Each item",
  lb:   "Per pound (lb)",
  kg:   "Per kilogram (kg)",
  oz:   "Per ounce (oz)",
  g:    "Per gram (g)",
};

/** Short suffix: "$15/lb", "$0.05/g", etc. */
export const PRICE_UNIT_SHORT: Record<PriceUnit, string> = {
  each: "",
  lb:   "/lb",
  kg:   "/kg",
  oz:   "/oz",
  g:    "/g",
};

/**
 * Preset chips offered to the customer when the dish is weight-priced.
 * The minimum-step values come from the brand decision: ¼ lb / 100 g.
 *
 * "each" returns no chips — the menu falls back to a +/− stepper for
 * each-priced dishes (the existing behaviour).
 */
export function weightChips(unit: PriceUnit): number[] {
  switch (unit) {
    case "lb": return [0.25, 0.5, 1, 1.5, 2];
    case "kg": return [0.25, 0.5, 1, 1.5, 2];
    case "oz": return [4, 8, 12, 16, 32];
    case "g":  return [100, 250, 500, 1000, 2000];
    case "each":
    default:   return [];
  }
}

/** The chip we pre-select when a customer first taps "Add" on a weight dish. */
export function defaultWeight(unit: PriceUnit): number {
  switch (unit) {
    case "lb": return 1;
    case "kg": return 0.5;
    case "oz": return 8;
    case "g":  return 250;
    case "each":
    default:   return 1;
  }
}

const FRACTION: Record<string, string> = {
  "0.25": "¼",
  "0.5":  "½",
  "0.75": "¾",
  "1.25": "1¼",
  "1.5":  "1½",
  "1.75": "1¾",
};

/**
 * Render a quantity for a given unit:
 *   formatQty(1.5, "lb")   → "1½ lb"
 *   formatQty(0.25, "lb")  → "¼ lb"
 *   formatQty(250, "g")    → "250 g"
 *   formatQty(1000, "g")   → "1 kg"  (auto-uplift for readability)
 *   formatQty(2, "each")   → "× 2"   (eaches keep the multiplier prefix)
 */
export function formatQty(qty: number, unit: PriceUnit): string {
  if (unit === "each") {
    return `× ${qty.toLocaleString()}`;
  }
  if (unit === "g" && qty >= 1000 && qty % 1000 === 0) {
    const kg = qty / 1000;
    return `${kg} kg`;
  }
  // Try a fraction symbol for the common ¼/½/¾ cases.
  const key = String(qty);
  if (FRACTION[key]) return `${FRACTION[key]} ${unit}`;
  // Otherwise show as decimal, trimmed of trailing zeros.
  const decimal = qty.toFixed(3).replace(/\.?0+$/, "");
  return `${decimal} ${unit}`;
}

/**
 * Multiplier applied to the dish's base price_cents to produce the line
 * total. For "each" this is just the integer count; for weight units the
 * price_cents IS the per-unit price, so qty * cents already gives the
 * line total. Same shape, kept as a function in case future units (e.g.
 * dozen) need a different mapping.
 */
export function lineTotalCents(unitPriceCents: number, qty: number): number {
  return Math.round(unitPriceCents * qty);
}
