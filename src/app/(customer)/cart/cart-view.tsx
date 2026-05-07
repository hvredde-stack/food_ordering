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
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Link href="/menu" className="inline-flex items-center text-sm text-muted gap-1 mb-3">
        <ArrowLeft className="w-4 h-4" /> Back to menu
      </Link>
      <h1 className="text-2xl font-bold mb-4">Your order</h1>

      {cart.lines.length === 0 ? (
        <Card><CardBody className="text-center py-10 text-muted">Cart is empty</CardBody></Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {cart.lines.map((line) => (
              <div key={line.dishId} className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="font-medium truncate">{line.name}</div>
                    <div className="font-semibold whitespace-nowrap">
                      {formatMoney(line.price_cents * line.quantity, currency)}
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-0.5">
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
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <div className="text-sm text-muted">Total</div>
              <div className="text-xl font-bold">
                {formatMoney(cart.totalCents, currency)}
              </div>
            </div>
            {err && <div className="text-sm text-red-600">{err}</div>}
            <Button size="lg" className="w-full" onClick={place} disabled={busy}>
              {busy ? "Placing order…" : "Place order"}
            </Button>
            <p className="text-xs text-center text-muted">No payment required — pay at the table.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
