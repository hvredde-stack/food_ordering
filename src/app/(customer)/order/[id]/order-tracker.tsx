"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChefHat, Flame, Clock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import type { OrderWithItems, OrderItem } from "@/lib/types";

const STAGES = [
  { key: "pending",   icon: Clock,        label: "Received" },
  { key: "preparing", icon: Flame,        label: "Preparing" },
  { key: "ready",     icon: ChefHat,      label: "Ready" },
  { key: "served",    icon: CheckCircle2, label: "Served" },
] as const;

export function OrderTracker({
  initialOrder,
  currency,
  restaurantName,
}: {
  initialOrder: OrderWithItems;
  currency: string;
  restaurantName: string;
}) {
  const [order, setOrder] = useState(initialOrder);

  // Customers don't have a Clerk session, so they don't authenticate to
  // Supabase Realtime. Instead, poll the API every few seconds — the
  // session cookie keeps the request scoped to the customer's own order.
  // Stops polling once everything is served (final state).
  useEffect(() => {
    if (order.status === "served" || order.status === "cancelled") return;
    let cancelled = false;
    const intervalMs = 4000;

    async function refetch() {
      try {
        const res = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const j = await res.json();
        setOrder(j.order);
      } catch {}
    }
    const timer = setInterval(refetch, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [order.id, order.status]);

  const stageIdx = STAGES.findIndex((s) => s.key === order.status);
  const allServed = order.status === "served";

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="text-xs uppercase tracking-wider text-muted">{restaurantName}</div>
      <h1 className="text-2xl font-bold mt-1">Order tracking</h1>
      <div className="text-sm text-muted">
        Placed {formatRelativeTime(order.created_at)} · #{order.id.slice(0, 8)}
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const reached = i <= stageIdx;
          return (
            <div
              key={s.key}
              className={`text-center rounded-xl border p-3 ${
                reached ? "border-fg bg-fg text-bg" : "border-border bg-card text-muted"
              }`}
            >
              <Icon className="mx-auto w-5 h-5" />
              <div className="text-xs mt-1 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      <Card className="mt-5">
        <div className="divide-y divide-border">
          {order.items.map((it) => (
            <ItemRow key={it.id} item={it} currency={currency} />
          ))}
        </div>
        <CardBody className="flex justify-between items-center border-t border-border">
          <div className="text-sm text-muted">Total</div>
          <div className="text-xl font-bold">{formatMoney(order.total_cents, currency)}</div>
        </CardBody>
      </Card>

      <div className="mt-5 flex gap-2">
        <Link href="/menu" className="flex-1">
          <Button variant="secondary" className="w-full">Order more</Button>
        </Link>
        {allServed && (
          <Link href="/feedback" className="flex-1">
            <Button className="w-full">Leave feedback →</Button>
          </Link>
        )}
      </div>

      {!allServed && (
        <p className="text-center text-xs text-muted mt-6">
          You can leave feedback once everything is served.
        </p>
      )}
    </div>
  );
}

function ItemRow({ item, currency }: { item: OrderItem; currency: string }) {
  return (
    <div className="p-4 flex items-start gap-3">
      <div className="text-sm font-medium w-6 text-muted">×{item.quantity}</div>
      <div className="flex-1">
        <div className="flex justify-between gap-2">
          <div className="font-medium">{item.dish_name}</div>
          <div className="font-semibold whitespace-nowrap">
            {formatMoney(item.unit_price_cents * item.quantity, currency)}
          </div>
        </div>
        {item.notes && <div className="text-xs text-muted mt-0.5">{item.notes}</div>}
        <div className="mt-2"><StatusBadge status={item.status} /></div>
      </div>
    </div>
  );
}
