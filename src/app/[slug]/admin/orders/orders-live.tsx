"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ListOrdered } from "lucide-react";
import { useClerkSupabaseClient } from "@/hooks/use-supabase";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import { formatQty } from "@/lib/weight";
import type { Order, OrderItem, RestaurantTable } from "@/lib/types";

interface Row extends Order {
  items: OrderItem[];
  table: Pick<RestaurantTable, "id" | "code" | "label"> | null;
}

interface Props {
  restaurantId: string;
  restaurantSlug: string;
  currency: string;
}

export function OrdersLive({ restaurantId, currency }: Props) {
  const [orders, setOrders] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useClerkSupabaseClient();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/orders?limit=100", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setOrders(j.orders);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const ch = supabase
      .channel(`admin-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => { refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, refresh, supabase]);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-4">
      <PageHeader
        eyebrow="Service"
        title="Live orders"
        lede="Streaming feed of every order, across every table and the takeout queue. Updates in real time as the kitchen works through them."
      />

      {loading ? (
        <div className="text-muted font-mono text-xs tracking-[0.18em] uppercase">Loading…</div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="w-8 h-8" />}
          eyebrow="Quiet for now"
          title="No orders yet."
          description="When a diner scans a table QR and submits an order, the ticket appears here within a second."
        />
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardHeader className="flex justify-between items-center gap-3">
                <div>
                  <div className="font-semibold">
                    Table {o.table?.code ?? "?"} · #{o.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-muted">{formatRelativeTime(o.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <div className="font-semibold">{formatMoney(o.total_cents, currency)}</div>
                </div>
              </CardHeader>
              <CardBody className="text-sm">
                <ul className="space-y-1">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span>{formatQty(Number(i.quantity), i.unit ?? "each")} {i.dish_name}</span>
                      <span className="text-xs text-muted capitalize">{i.status}</span>
                    </li>
                  ))}
                </ul>
                {o.notes && (
                  <div className="mt-2 text-xs italic text-muted border-l-2 border-border pl-2">
                    “{o.notes}”
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
