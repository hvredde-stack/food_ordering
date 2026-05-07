"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DishImage } from "@/components/ui/dish-image";
import { useCart } from "@/components/customer/cart-provider";
import { formatMoney, cn } from "@/lib/utils";
import { PRICE_UNIT_SHORT, weightChips, formatQty, lineTotalCents } from "@/lib/weight";
import type { Dish, MenuCategory, OrderType, Restaurant, RestaurantTable } from "@/lib/types";

interface Props {
  restaurant: Restaurant;
  table: RestaurantTable | null;
  orderType: OrderType;
  categories: MenuCategory[];
  dishes: Dish[];
}

export function MenuView({ restaurant, table, orderType, categories, dishes }: Props) {
  const cart = useCart();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null
  );

  const grouped = useMemo(() => {
    const m = new Map<string | null, Dish[]>();
    for (const d of dishes) {
      const arr = m.get(d.category_id) ?? [];
      arr.push(d);
      m.set(d.category_id, arr);
    }
    return m;
  }, [dishes]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
              {orderType === "takeout" ? "Takeout" : table ? `Table ${table.code}` : "Menu"}
            </div>
            <div className="font-display text-base mt-1 truncate">{restaurant.name}</div>
          </div>
          <Link href="/cart">
            <Button variant="secondary" className="relative">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono text-xs tracking-wider uppercase">Cart</span>
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-fg text-bg rounded-full h-5 min-w-5 text-[10px] font-mono flex items-center justify-center px-1 tabular-nums">
                  {cart.count}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCategory(c.id);
                  document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap",
                  activeCategory === c.id
                    ? "bg-fg text-bg border-fg"
                    : "bg-card text-fg border-border hover:bg-muted"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {categories.map((c) => {
          const items = grouped.get(c.id) ?? [];
          if (items.length === 0) return null;
          return (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32 mb-12">
              <h2 className="font-display text-3xl mb-5 tracking-tight">{c.name}</h2>
              <div className="grid gap-3">
                {items.map((d) => (
                  <DishRow key={d.id} dish={d} currency={restaurant.currency} />
                ))}
              </div>
            </section>
          );
        })}
        {(grouped.get(null)?.length ?? 0) > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-3xl mb-5 tracking-tight">Other</h2>
            <div className="grid gap-3">
              {(grouped.get(null) ?? []).map((d) => (
                <DishRow key={d.id} dish={d} currency={restaurant.currency} />
              ))}
            </div>
          </section>
        )}
      </main>

      {cart.count > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
          <Button
            size="lg"
            className="w-full justify-between"
            onClick={() => router.push("/cart")}
          >
            <span className="font-mono text-xs tracking-[0.18em] uppercase">
              {cart.count} item{cart.count === 1 ? "" : "s"}
            </span>
            <span className="font-mono tabular-nums text-sm">
              {formatMoney(cart.totalCents, restaurant.currency)} →
            </span>
          </Button>
        </div>
      )}
    </>
  );
}

function DishRow({ dish, currency }: { dish: Dish; currency: string }) {
  const cart = useCart();
  const line = cart.lines.find((l) => l.dishId === dish.id);
  const unit = dish.price_unit ?? "each";
  const isWeight = unit !== "each";
  const chips = weightChips(unit);

  return (
    <Card>
      <CardBody className="flex gap-4 items-start p-5">
        <DishImage name={dish.name} imageUrl={dish.image_url} size={96} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-4 items-baseline">
            <h3 className="font-display text-xl tracking-tight truncate">{dish.name}</h3>
            <div className="font-mono text-sm tabular-nums whitespace-nowrap">
              {formatMoney(dish.price_cents, currency)}
              <span className="text-muted">{PRICE_UNIT_SHORT[unit]}</span>
            </div>
          </div>
          {dish.description && (
            <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-3">{dish.description}</p>
          )}

          {/* Add / quantity controls. Each-priced and weight-priced split
              here: eaches use the +/- stepper (existing behaviour);
              weight items get preset chips that map to ¼/½/1/1½/2 of the
              dish's unit. The selected chip is the line quantity. */}
          <div className="mt-4">
            {isWeight ? (
              <WeightChips
                dish={dish}
                chips={chips}
                unit={unit}
                selectedQty={line?.quantity}
                currency={currency}
              />
            ) : line ? (
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-muted rounded-lg">
                  <button
                    className="h-8 w-8 flex items-center justify-center hover:bg-border rounded-l-lg"
                    onClick={() => cart.set(dish.id, line.quantity - 1)}
                    aria-label="Decrease"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-semibold tabular-nums">{line.quantity}</span>
                  <button
                    className="h-8 w-8 flex items-center justify-center hover:bg-border rounded-r-lg"
                    onClick={() => cart.set(dish.id, line.quantity + 1)}
                    aria-label="Increase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="font-mono text-xs text-muted tabular-nums">
                  = {formatMoney(lineTotalCents(dish.price_cents, line.quantity), currency)}
                </span>
              </div>
            ) : (
              <Button size="sm" onClick={() => cart.add(dish)}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function WeightChips({
  dish,
  chips,
  unit,
  selectedQty,
  currency,
}: {
  dish: Dish;
  chips: number[];
  unit: import("@/lib/types").PriceUnit;
  selectedQty: number | undefined;
  currency: string;
}) {
  const cart = useCart();
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">
        Pick a weight
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((qty) => {
          const active = selectedQty === qty;
          return (
            <button
              key={qty}
              onClick={() => {
                // Tapping the active chip removes it from the cart;
                // otherwise sync the line to the new weight.
                if (active) cart.set(dish.id, 0);
                else if (selectedQty === undefined) {
                  cart.add(dish);
                  // After add(), the default quantity is set; immediately
                  // sync it to whatever chip the user actually picked.
                  cart.set(dish.id, qty);
                } else {
                  cart.set(dish.id, qty);
                }
              }}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-mono tabular-nums border transition-colors",
                active
                  ? "bg-fg text-bg border-fg"
                  : "bg-card text-fg border-border hover:border-accent/60"
              )}
            >
              {formatQty(qty, unit)}
            </button>
          );
        })}
      </div>
      {selectedQty !== undefined && (
        <div className="mt-2 font-mono text-xs text-muted tabular-nums">
          {formatQty(selectedQty, unit)} = {formatMoney(lineTotalCents(dish.price_cents, selectedQty), currency)}
        </div>
      )}
    </div>
  );
}
