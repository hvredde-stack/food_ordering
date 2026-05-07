"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/input";
import { useCart } from "@/components/customer/cart-provider";
import { formatMoney, cn } from "@/lib/utils";
import { PRICE_UNIT_SHORT, weightChips, formatQty, lineTotalCents } from "@/lib/weight";

export function CartView({ currency }: { currency: string }) {
  const cart = useCart();
  const router = useRouter();
  const [orderNotes, setOrderNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function place() {
    if (cart.lines.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart.lines.map((l) => ({
            dishId: l.dishId,
            quantity: l.quantity,
            unit: l.unit,
            notes: l.notes,
          })),
          notes: orderNotes || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Could not place order");
        return;
      }
      await res.json();
      cart.clear();
      router.push("/session");
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <Link
        href="/menu"
        className="inline-flex items-center text-xs font-mono tracking-[0.18em] uppercase text-muted gap-1 mb-5 hover:text-fg transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to menu
      </Link>

      {/* Editorial header — eyebrow + display title, matching the rest
          of the product. Cart is the moment of commitment, so the type
          gets the same dignity as the marketing landing. */}
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
          Your order
        </div>
        <h1 className="font-display font-light text-4xl md:text-5xl tracking-tight mt-3 leading-[1.05]">
          Review &amp; place
        </h1>
      </div>

      {cart.lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          eyebrow="Cart"
          title="Nothing here yet."
          description="Add a few dishes from the menu and they'll appear here, ready to send to the kitchen."
          action={
            <Link href="/menu">
              <Button>
                <span className="font-mono text-[11px] tracking-[0.18em] uppercase">Back to menu</span>
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {cart.lines.map((line) => (
              <CartLineRow key={line.dishId} line={line} currency={currency} />
            ))}
          </div>

          <CardFooter className="space-y-3">
            <div>
              <label className="text-xs font-mono tracking-[0.14em] uppercase text-muted">
                Notes for the kitchen (optional)
              </label>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Allergies, special requests…"
                className="mt-2"
              />
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-border">
              <div className="text-xs font-mono tracking-[0.18em] uppercase text-muted">Total</div>
              <div className="font-display text-3xl tabular-nums">
                {formatMoney(cart.totalCents, currency)}
              </div>
            </div>
            {err && <div className="text-sm text-red-500">{err}</div>}
            <Button size="lg" className="w-full" onClick={place} disabled={busy}>
              <span className="font-mono text-xs tracking-[0.18em] uppercase">
                {busy ? "Placing order…" : "Place order"}
              </span>
            </Button>
            <p className="text-xs text-center text-muted italic font-display">
              No payment required — pay at the table.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function CartLineRow({
  line,
  currency,
}: {
  line: import("@/components/customer/cart-provider").CartLine;
  currency: string;
}) {
  const cart = useCart();
  const isWeight = line.unit !== "each";
  const total = lineTotalCents(line.price_cents, line.quantity);

  return (
    <div className="p-5">
      <div className="flex justify-between gap-3 items-baseline">
        <div className="font-display text-lg tracking-tight truncate">{line.name}</div>
        <div className="font-mono text-sm tabular-nums whitespace-nowrap">
          {formatMoney(total, currency)}
        </div>
      </div>
      <div className="text-xs text-muted mt-1 font-mono tabular-nums">
        {formatQty(line.quantity, line.unit)} · {formatMoney(line.price_cents, currency)}
        {PRICE_UNIT_SHORT[line.unit]}
      </div>

      {/* Quantity controls — chips for weight, stepper for each. */}
      <div className="mt-3">
        {isWeight ? (
          <WeightChipsRow
            unit={line.unit}
            selectedQty={line.quantity}
            onPick={(qty) => cart.set(line.dishId, qty)}
          />
        ) : (
          <div className="inline-flex items-center bg-muted rounded-lg">
            <button
              className="h-8 w-8 flex items-center justify-center hover:bg-border rounded-l-lg"
              onClick={() => cart.set(line.dishId, line.quantity - 1)}
              aria-label="Decrease"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-semibold tabular-nums">{line.quantity}</span>
            <button
              className="h-8 w-8 flex items-center justify-center hover:bg-border rounded-r-lg"
              onClick={() => cart.set(line.dishId, line.quantity + 1)}
              aria-label="Increase"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <Textarea
        placeholder="Notes (e.g. no onions)"
        value={line.notes ?? ""}
        onChange={(e) => cart.setNotes(line.dishId, e.target.value)}
        className="mt-3"
      />
      <div className="mt-2">
        <button
          onClick={() => cart.remove(line.dishId)}
          className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-red-500 inline-flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      </div>
    </div>
  );
}

function WeightChipsRow({
  unit,
  selectedQty,
  onPick,
}: {
  unit: import("@/lib/types").PriceUnit;
  selectedQty: number;
  onPick: (qty: number) => void;
}) {
  const chips = weightChips(unit);
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((qty) => {
        const active = selectedQty === qty;
        return (
          <button
            key={qty}
            onClick={() => onPick(qty)}
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
  );
}
