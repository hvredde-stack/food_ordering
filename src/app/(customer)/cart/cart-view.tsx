"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useCart } from "@/components/customer/cart-provider";
import { formatMoney } from "@/lib/utils";

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
      <Link href="/menu" className="inline-flex items-center text-xs font-mono tracking-[0.18em] uppercase text-muted gap-1 mb-5 hover:text-fg transition">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to menu
      </Link>
      <h1 className="font-display text-4xl tracking-tight mb-6">Your order</h1>

      {cart.lines.length === 0 ? (
        <Card><CardBody className="text-center py-12 text-muted">Cart is empty</CardBody></Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {cart.lines.map((line) => (
              <div key={line.dishId} className="p-5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 items-baseline">
                    <div className="font-display text-lg truncate">{line.name}</div>
                    <div className="font-mono text-sm tabular-nums whitespace-nowrap">
                      {formatMoney(line.price_cents * line.quantity, currency)}
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-1 font-mono">
                    {formatMoney(line.price_cents, currency)} each
                  </div>
                  <Textarea
                    placeholder="Notes (e.g. no onions)"
                    value={line.notes ?? ""}
                    onChange={(e) => cart.setNotes(line.dishId, e.target.value)}
                    className="mt-2"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="inline-flex items-center bg-muted rounded-lg">
                      <button
                        className="h-8 w-8 flex items-center justify-center hover:bg-border rounded-l-lg"
                        onClick={() => cart.set(line.dishId, line.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 text-sm font-semibold">{line.quantity}</span>
                      <button
                        className="h-8 w-8 flex items-center justify-center hover:bg-border rounded-r-lg"
                        onClick={() => cart.set(line.dishId, line.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => cart.remove(line.dishId)}
                      className="text-muted hover:text-red-600 p-1"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <CardFooter className="space-y-3">
            <div>
              <label className="text-xs text-muted">Notes for the kitchen (optional)</label>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Allergies, special requests…"
                className="mt-1"
              />
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-border">
              <div className="text-xs font-mono tracking-[0.18em] uppercase text-muted">Total</div>
              <div className="font-mono text-2xl tabular-nums">
                {formatMoney(cart.totalCents, currency)}
              </div>
            </div>
            {err && <div className="text-sm text-red-600">{err}</div>}
            <Button size="lg" className="w-full" onClick={place} disabled={busy}>
              <span className="font-mono text-xs tracking-[0.18em] uppercase">
                {busy ? "Placing order…" : "Place order"}
              </span>
            </Button>
            <p className="text-xs text-center text-muted italic font-display">No payment required — pay at the table.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
