import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatMoney, formatRelativeTime } from "@/lib/utils";

export default async function PlatformRestaurantsList() {
  const supabase = getSupabaseAdmin();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: restaurants }, { data: orders30 }] = await Promise.all([
    supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("restaurant_id, total_cents, status, created_at")
      .gte("created_at", since30),
  ]);

  const stats = new Map<string, { orders: number; revenue: number; lastAt: string | null }>();
  for (const o of orders30 ?? []) {
    if (o.status === "cancelled") continue;
    const k = o.restaurant_id as string;
    const row = stats.get(k) ?? { orders: 0, revenue: 0, lastAt: null };
    row.orders += 1;
    row.revenue += (o.total_cents as number) ?? 0;
    if (!row.lastAt || (o.created_at as string) > row.lastAt) row.lastAt = o.created_at as string;
    stats.set(k, row);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Directory</div>
          <h1 className="font-display text-4xl md:text-5xl mt-3 tracking-tight">Restaurants</h1>
          <p className="font-mono text-xs text-muted mt-2">{(restaurants ?? []).length} tenants on the platform</p>
        </div>
        <Link href="/platform/restaurants/new">
          <Button>
            <Plus className="w-4 h-4" />
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase">Onboard restaurant</span>
          </Button>
        </Link>
      </div>

      {(restaurants ?? []).length === 0 ? (
        <Card>
          <div className="p-8 text-center text-muted text-sm">
            No restaurants yet. Click <strong>Onboard restaurant</strong> to add the first one.
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader className="grid grid-cols-[1fr,90px,120px,140px,80px] gap-3 text-xs uppercase tracking-wider text-muted">
            <div>Restaurant</div>
            <div className="text-right">Orders 30d</div>
            <div className="text-right">Revenue 30d</div>
            <div>Last order</div>
            <div className="text-right">Status</div>
          </CardHeader>
          <div className="divide-y divide-border">
            {(restaurants ?? []).map((r) => {
              const s = stats.get(r.id as string) ?? { orders: 0, revenue: 0, lastAt: null };
              return (
                <Link
                  key={r.id as string}
                  href={`/platform/restaurants/${r.id}`}
                  className="grid grid-cols-[1fr,90px,120px,140px,80px] gap-3 px-4 py-3 hover:bg-muted text-sm items-center"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.name as string}</div>
                    <div className="text-xs text-muted truncate">
                      /{r.slug as string} · joined {formatRelativeTime(r.created_at as string)}
                    </div>
                  </div>
                  <div className="text-right tabular-nums">{s.orders}</div>
                  <div className="text-right tabular-nums">
                    {formatMoney(s.revenue, (r.currency as string) ?? "USD")}
                  </div>
                  <div className="text-xs text-muted">
                    {s.lastAt ? formatRelativeTime(s.lastAt) : "—"}
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md border ${
                        r.status === "active"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {r.status as string}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
