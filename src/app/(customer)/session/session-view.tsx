"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Clock, ChefHat, CheckCircle2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatRelativeTime, cn } from "@/lib/utils";
import type { Order, OrderItem, OrderType } from "@/lib/types";

interface OrderRow extends Order {
  items: OrderItem[];
}

interface Props {
  currency: string;
  restaurantName: string;
  scopeLabel: string;
  meSessionId: string;
  meCustomerName: string | null;
  orderType: OrderType;
}

export function SessionView({
  currency,
  restaurantName,
  scopeLabel,
  meSessionId,
  meCustomerName,
  orderType,
}: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function refetch() {
      try {
        const res = await fetch("/api/sessions/shared", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const j = await res.json();
        setOrders(j.orders ?? []);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    }
    refetch();
    const t = setInterval(refetch, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Aggregate stats
  const total = orders.reduce((s, o) => s + (o.status === "cancelled" ? 0 : o.total_cents), 0);
  const totalItems = orders.flatMap((o) => o.items).filter((i) => i.status !== "cancelled").length;
  const allServed = orders.length > 0 && orders.every((o) => o.status === "served" || o.status === "cancelled");
  const peopleNames = Array.from(
    new Set(orders.map((o) => o.customer_name).filter(Boolean) as string[])
  );

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <header className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">{restaurantName}</div>
        <div className="flex items-baseline justify-between gap-3 mt-2">
          <h1 className="font-display text-4xl tracking-tight">{scopeLabel}</h1>
          {meCustomerName && (
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
              You · <span className="text-fg">{meCustomerName}</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat icon={<Users className="w-4 h-4" />} label="People" value={peopleNames.length || 1} />
        <Stat icon={<Plus className="w-4 h-4" />} label="Items" value={totalItems} />
        <Stat label="Total" value={formatMoney(total, currency)} />
      </div>

      <div className="flex gap-2 mb-3">
        <Link href="/menu" className="flex-1">
          <Button variant="secondary" className="w-full">
            <Plus className="w-4 h-4" /> Add more
          </Button>
        </Link>
        {allServed && (
          <Link href="/feedback" className="flex-1">
            <Button className="w-full">Leave feedback →</Button>
          </Link>
        )}
      </div>

      {loading && orders.length === 0 ? (
        <Card><CardBody className="text-center py-10 text-muted">Loading…</CardBody></Card>
      ) : orders.length === 0 ? (
        <Card><CardBody className="text-center py-10 text-muted">
          No orders yet. Add something from the menu.
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              currency={currency}
              isYou={o.session_id === meSessionId}
            />
          ))}
        </div>
      )}

      {orderType === "takeout" && allServed && (
        <Card className="mt-5 bg-green-50 border-green-200">
          <CardBody className="text-center text-green-800">
            <CheckCircle2 className="w-6 h-6 mx-auto" />
            <div className="font-semibold mt-1">Your takeout is ready for pickup</div>
            <div className="text-sm">Look for your name at the counter.</div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="p-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted flex items-center gap-1">
          {icon} {label}
        </div>
        <div className="font-display text-lg mt-1 tracking-tight">{value}</div>
      </CardBody>
    </Card>
  );
}

function OrderCard({ order, currency, isYou }: { order: OrderRow; currency: string; isYou: boolean }) {
  return (
    <Card className={cn(isYou && "ring-2 ring-accent")}>
      <CardHeader className="flex justify-between items-center">
        <div>
          <div className="font-display text-lg flex items-center gap-2">
            {order.customer_name ?? "Guest"}
            {isYou && <span className="font-mono text-[10px] uppercase tracking-[0.18em] bg-accent text-bg px-1.5 py-0.5 rounded">you</span>}
          </div>
          <div className="text-xs text-muted font-mono mt-0.5">
            <Clock className="w-3 h-3 inline mr-0.5" />
            {formatRelativeTime(order.created_at)}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </CardHeader>
      <div className="divide-y divide-border">
        {order.items.map((it) => (
          <div key={it.id} className="px-4 py-2 flex items-start gap-2 text-sm">
            <div className="w-6 text-muted font-medium">×{it.quantity}</div>
            <div className="flex-1">
              <div className="flex justify-between gap-2">
                <div>{it.dish_name}</div>
                <div className="text-muted whitespace-nowrap">
                  {formatMoney(it.unit_price_cents * it.quantity, currency)}
                </div>
              </div>
              {it.notes && <div className="text-xs italic text-muted">{it.notes}</div>}
              <div className="mt-1"><StatusBadge status={it.status} /></div>
            </div>
          </div>
        ))}
      </div>
      <CardBody className="flex justify-between items-baseline text-sm border-t border-border">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">Subtotal</span>
        <span className="font-mono tabular-nums">{formatMoney(order.total_cents, currency)}</span>
      </CardBody>
    </Card>
  );
}
