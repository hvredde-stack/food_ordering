"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Smile, Frown, Flame, ChefHat, CheckCircle2, RotateCw } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { useClerkSupabaseClient } from "@/hooks/use-supabase";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import type { ItemStatus, OrderItem, Order, RestaurantTable, SentimentEvent } from "@/lib/types";

interface OrderRow extends Order {
  items: OrderItem[];
  table: Pick<RestaurantTable, "id" | "code" | "label">;
}

interface Props {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  currency: string;
}

export function KitchenBoard({ restaurantId, restaurantSlug, restaurantName, currency }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [sentiment, setSentiment] = useState<SentimentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useClerkSupabaseClient();

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/kitchen/orders?restaurant=${encodeURIComponent(restaurantSlug)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const j = await res.json();
      setOrders(j.orders);
      setSentiment(j.sentiment ?? []);
    }
    setLoading(false);
  }, [restaurantSlug]);

  useEffect(() => { refresh(); }, [refresh]);

  // Real-time refresh on any relevant change. The Clerk session token
  // is attached automatically via supabase-js's accessToken callback,
  // so RLS sees auth.jwt()->>'sub' and lets the owner through.
  useEffect(() => {
    const ch = supabase
      .channel(`kitchen-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => { refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `restaurant_id=eq.${restaurantId}` },
        () => { refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sentiment_events", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => { setSentiment((s) => [payload.new as SentimentEvent, ...s].slice(0, 60)); }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, refresh, supabase]);

  async function setItemStatus(item: OrderItem, status: ItemStatus) {
    // Optimistic update.
    setOrders((prev) =>
      prev.map((o) =>
        o.id === item.order_id
          ? { ...o, items: o.items.map((i) => (i.id === item.id ? { ...i, status } : i)) }
          : o
      )
    );
    await fetch(`/api/kitchen/items/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, restaurantSlug }),
    });
  }

  const grouped = useMemo(() => {
    const m = new Map<string, { table: OrderRow["table"]; orders: OrderRow[] }>();
    for (const o of orders) {
      const k = o.table.id;
      const e = m.get(k) ?? { table: o.table, orders: [] };
      e.orders.push(o);
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => a.table.code.localeCompare(b.table.code));
  }, [orders]);

  const recentSadCount = sentiment.filter((s) => s.kind === "sad").length;
  const recentHappyCount = sentiment.filter((s) => s.kind === "happy").length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-bg/90 backdrop-blur border-b border-border z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{restaurantName} — Kitchen</h1>
            <div className="text-xs text-muted">Live order queue</div>
          </div>
          <div className="flex items-center gap-3">
            <SentimentPulse happy={recentHappyCount} sad={recentSadCount} />
            <Button variant="secondary" size="sm" onClick={refresh}>
              <RotateCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">
        {loading ? (
          <div className="text-muted text-center py-10">Loading…</div>
        ) : grouped.length === 0 ? (
          <Card><CardBody className="text-center py-16 text-muted">
            All clear — no active orders.
          </CardBody></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grouped.map(({ table, orders }) => (
              <Card key={table.id} className="overflow-hidden">
                <CardHeader className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Table {table.code}</div>
                    {table.label && <div className="text-xs text-muted">{table.label}</div>}
                  </div>
                  <div className="text-xs text-muted">{orders.length} order{orders.length === 1 ? "" : "s"}</div>
                </CardHeader>
                <div className="divide-y divide-border">
                  {orders.map((o) => (
                    <div key={o.id} className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs text-muted">
                          #{o.id.slice(0, 6)} · {formatRelativeTime(o.created_at)}
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="space-y-2">
                        {o.items.map((it) => (
                          <ItemControl
                            key={it.id}
                            item={it}
                            currency={currency}
                            onStatus={(s) => setItemStatus(it, s)}
                          />
                        ))}
                      </div>
                      {o.notes && (
                        <div className="mt-2 text-xs italic text-muted border-l-2 border-border pl-2">
                          “{o.notes}”
                        </div>
                      )}
                      <div className="mt-2 text-right text-xs text-muted">
                        {formatMoney(o.total_cents, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ItemControl({
  item,
  currency,
  onStatus,
}: {
  item: OrderItem;
  currency: string;
  onStatus: (s: ItemStatus) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-2">
      <div className="flex justify-between items-center gap-2">
        <div className="font-medium text-sm">
          ×{item.quantity} {item.dish_name}
        </div>
        <div className="text-xs text-muted whitespace-nowrap">
          {formatMoney(item.unit_price_cents * item.quantity, currency)}
        </div>
      </div>
      {item.notes && <div className="text-xs italic text-muted mt-1">{item.notes}</div>}
      <div className="flex items-center justify-between gap-2 mt-2">
        <StatusBadge status={item.status} />
        <div className="flex gap-1">
          {item.status !== "preparing" && item.status !== "ready" && item.status !== "served" && (
            <Button size="sm" variant="secondary" onClick={() => onStatus("preparing")}>
              <Flame className="w-3.5 h-3.5" /> Start
            </Button>
          )}
          {item.status === "preparing" && (
            <Button size="sm" variant="secondary" onClick={() => onStatus("ready")}>
              <ChefHat className="w-3.5 h-3.5" /> Ready
            </Button>
          )}
          {item.status === "ready" && (
            <Button size="sm" variant="secondary" onClick={() => onStatus("served")}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Served
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SentimentPulse({ happy, sad }: { happy: number; sad: number }) {
  const tone = sad > happy ? "bg-red-100 text-red-800" : happy > 0 ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-700";
  return (
    <div className={`hidden sm:flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm ${tone}`}>
      <span className="inline-flex items-center gap-1"><Smile className="w-4 h-4" /> {happy}</span>
      <span className="inline-flex items-center gap-1"><Frown className="w-4 h-4" /> {sad}</span>
      <span className="text-xs opacity-70">last hour</span>
    </div>
  );
}
