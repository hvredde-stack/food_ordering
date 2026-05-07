"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Smile, Frown, Flame, ChefHat, CheckCircle2, RotateCw, ShoppingBag, Utensils } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { useClerkSupabaseClient } from "@/hooks/use-supabase";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import type {
  ItemStatus,
  OrderItem,
  Order,
  RestaurantTable,
  SentimentEvent,
  OrderType,
} from "@/lib/types";

interface OrderRow extends Order {
  items: OrderItem[];
  table: Pick<RestaurantTable, "id" | "code" | "label"> | null;
}

interface Props {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  currency: string;
}

interface Group {
  key: string;
  type: OrderType;
  label: string;     // "Table T-01" | "Takeout"
  sublabel?: string; // table label or takeout customer count
  orders: OrderRow[];
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

  // Group: dine-in by table_id, takeout by takeout_code
  const groups = useMemo<Group[]>(() => {
    const m = new Map<string, Group>();
    for (const o of orders) {
      const isTakeout = o.order_type === "takeout";
      const key = isTakeout ? `to:${o.takeout_code}` : `t:${o.table?.id ?? "?"}`;
      const existing = m.get(key);
      if (existing) {
        existing.orders.push(o);
        continue;
      }
      m.set(key, {
        key,
        type: isTakeout ? "takeout" : "dine-in",
        label: isTakeout ? "Takeout" : `Table ${o.table?.code ?? "?"}`,
        sublabel: isTakeout ? undefined : (o.table?.label ?? undefined),
        orders: [o],
      });
    }
    // Stable sort: dine-in first, then takeout, alphabetical within
    return [...m.values()].sort((a, b) => {
      if (a.type !== b.type) return a.type === "dine-in" ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
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
        ) : groups.length === 0 ? (
          <Card><CardBody className="text-center py-16 text-muted">
            All clear — no active orders.
          </CardBody></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <GroupCard
                key={g.key}
                group={g}
                currency={currency}
                onStatus={setItemStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function GroupCard({
  group,
  currency,
  onStatus,
}: {
  group: Group;
  currency: string;
  onStatus: (item: OrderItem, status: ItemStatus) => void;
}) {
  const Icon = group.type === "takeout" ? ShoppingBag : Utensils;
  const toneClass = group.type === "takeout" ? "bg-amber-50" : "bg-card";
  const peopleNames = Array.from(
    new Set(group.orders.map((o) => o.customer_name).filter(Boolean) as string[])
  );

  return (
    <Card className={`overflow-hidden ${toneClass}`}>
      <CardHeader className="flex justify-between items-start">
        <div>
          <div className="font-semibold flex items-center gap-1.5">
            <Icon className="w-4 h-4" />
            {group.label}
          </div>
          {group.sublabel && <div className="text-xs text-muted">{group.sublabel}</div>}
          {peopleNames.length > 0 && (
            <div className="text-xs text-muted mt-0.5">{peopleNames.join(", ")}</div>
          )}
        </div>
        <div className="text-xs text-muted">
          {group.orders.length} order{group.orders.length === 1 ? "" : "s"}
        </div>
      </CardHeader>
      <div className="divide-y divide-border">
        {group.orders.map((o) => (
          <div key={o.id} className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-muted">
                <span className="font-medium text-fg">{o.customer_name ?? "Guest"}</span>
                {" · "}{formatRelativeTime(o.created_at)}
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="space-y-2">
              {o.items.map((it) => (
                <ItemControl
                  key={it.id}
                  item={it}
                  currency={currency}
                  onStatus={(s) => onStatus(it, s)}
                />
              ))}
            </div>
            {o.notes && (
              <div className="mt-2 text-xs italic text-muted border-l-2 border-border pl-2">
                "{o.notes}"
              </div>
            )}
            <div className="mt-2 text-right text-xs text-muted">
              {formatMoney(o.total_cents, currency)}
            </div>
          </div>
        ))}
      </div>
    </Card>
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
          {item.customer_name && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-muted">
              {item.customer_name}
            </span>
          )}
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
  const tone =
    sad > happy ? "bg-red-100 text-red-800"
    : happy > 0 ? "bg-green-100 text-green-800"
    : "bg-zinc-100 text-zinc-700";
  return (
    <div className={`hidden sm:flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm ${tone}`}>
      <span className="inline-flex items-center gap-1"><Smile className="w-4 h-4" /> {happy}</span>
      <span className="inline-flex items-center gap-1"><Frown className="w-4 h-4" /> {sad}</span>
      <span className="text-xs opacity-70">last hour</span>
    </div>
  );
}
