import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatMoney, formatRelativeTime } from "@/lib/utils";

export default async function PlatformOverview() {
  const supabase = getSupabaseAdmin();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: restaurants }, { data: orders30 }, { data: sentiment30 }] = await Promise.all([
    supabase.from("restaurants").select("id, name, slug, status, currency, created_at"),
    supabase
      .from("orders")
      .select("status, total_cents, restaurant_id, created_at")
      .gte("created_at", since30),
    supabase.from("sentiment_events").select("kind").gte("created_at", since30),
  ]);

  const live = (orders30 ?? []).filter((o) => o.status !== "cancelled");
  const totalOrders = live.length;
  const totalRevenue = live.reduce((s, o) => s + ((o.total_cents as number) ?? 0), 0);
  const happy = (sentiment30 ?? []).filter((s) => s.kind === "happy").length;
  const sad = (sentiment30 ?? []).filter((s) => s.kind === "sad").length;
  const active = (restaurants ?? []).filter((r) => r.status === "active").length;
  const suspended = (restaurants ?? []).filter((r) => r.status === "suspended").length;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Console</div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-3">Platform overview</h1>
        <p className="text-muted mt-3 leading-relaxed max-w-xl">
          Cross-tenant view of every restaurant on the platform.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Restaurants" value={`${active} active${suspended ? ` · ${suspended} suspended` : ""}`} />
        <Stat label="Orders (30d)" value={totalOrders} />
        <Stat label="Revenue (30d)" value={formatMoney(totalRevenue, "USD")} />
        <Stat
          label="Sentiment (30d)"
          value={`${happy} 🙂 · ${sad} ☹️`}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Recent restaurants</div>
              <div className="text-xs text-muted">Newest 5 onboarded.</div>
            </div>
            <Link href="/platform/restaurants" className="text-sm underline">View all</Link>
          </div>
        </CardHeader>
        <div className="divide-y divide-border">
          {(restaurants ?? []).slice(0, 5).map((r) => (
            <Link
              key={r.id as string}
              href={`/platform/restaurants/${r.id}`}
              className="block px-4 py-3 hover:bg-muted"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.name as string}</div>
                  <div className="text-xs text-muted">
                    /{r.slug as string} · joined {formatRelativeTime(r.created_at as string)}
                  </div>
                </div>
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
          ))}
          {(restaurants ?? []).length === 0 && (
            <div className="p-6 text-center text-muted text-sm">
              No restaurants yet. <Link href="/platform/restaurants/new" className="underline">Onboard one</Link>.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">{label}</div>
        <div className="font-display text-3xl mt-2 tracking-tight">{value}</div>
      </CardBody>
    </Card>
  );
}
