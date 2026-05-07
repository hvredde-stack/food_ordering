import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import { RestaurantControls } from "./controls";
import { UrlHub } from "./url-hub";

export default async function PlatformRestaurantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!restaurant) notFound();

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: orders }, { data: sentiment }, { data: tables }, { count: dishCount }, { data: feedback }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("status, order_type, total_cents, created_at")
        .eq("restaurant_id", id)
        .gte("created_at", since30),
      supabase
        .from("sentiment_events")
        .select("kind")
        .eq("restaurant_id", id)
        .gte("created_at", since30),
      supabase
        .from("restaurant_tables")
        .select("id, code, label, seats")
        .eq("restaurant_id", id)
        .order("code"),
      supabase.from("dishes").select("*", { count: "exact", head: true }).eq("restaurant_id", id),
      supabase
        .from("feedback")
        .select("rating, comment, created_at")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
  const tableCount = (tables ?? []).length;

  const live = (orders ?? []).filter((o) => o.status !== "cancelled");
  const dineIn = live.filter((o) => o.order_type === "dine-in");
  const takeout = live.filter((o) => o.order_type === "takeout");
  const revenue = live.reduce((s, o) => s + ((o.total_cents as number) ?? 0), 0);
  const happy = (sentiment ?? []).filter((s) => s.kind === "happy").length;
  const sad = (sentiment ?? []).filter((s) => s.kind === "sad").length;
  const currency = (restaurant.currency as string) ?? "USD";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/platform/restaurants" className="text-sm text-muted underline">← All restaurants</Link>
          <h1 className="text-2xl font-bold mt-1">{restaurant.name as string}</h1>
          <div className="text-sm text-muted">
            slug <code className="text-xs px-1.5 py-0.5 rounded bg-muted">{restaurant.slug as string}</code>
            {" · "}joined {formatRelativeTime(restaurant.created_at as string)}
            {" · "}owner <code className="text-xs">{restaurant.owner_user_id as string}</code>
          </div>
        </div>
        <RestaurantControls
          id={restaurant.id as string}
          initialStatus={restaurant.status as "active" | "suspended"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Orders (30d)" value={live.length} />
        <Stat label="Revenue (30d)" value={formatMoney(revenue, currency)} />
        <Stat label="Tables" value={tableCount ?? 0} />
        <Stat label="Dishes" value={dishCount ?? 0} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Dine-in (30d)" value={dineIn.length} />
        <Stat label="Takeout (30d)" value={takeout.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><div className="font-semibold">Sentiment (30d)</div></CardHeader>
          <CardBody className="flex items-center justify-around py-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{happy}</div>
              <div className="text-xs text-muted mt-1">Happy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{sad}</div>
              <div className="text-xs text-muted mt-1">Sad</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div className="font-semibold">Recent feedback</div></CardHeader>
          <div className="divide-y divide-border">
            {(feedback ?? []).length === 0 ? (
              <div className="p-4 text-muted text-sm text-center">No feedback yet.</div>
            ) : (
              (feedback ?? []).map((f, i) => (
                <div key={i} className="p-3 text-sm">
                  <div className="flex justify-between text-xs text-muted">
                    <span>{new Date(f.created_at as string).toLocaleDateString()}</span>
                    <span>{"★".repeat(f.rating as number)}{"☆".repeat(5 - (f.rating as number))}</span>
                  </div>
                  {f.comment && <div className="mt-1">{f.comment as string}</div>}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <UrlHub
        slug={restaurant.slug as string}
        takeoutCode={(restaurant.takeout_code as string | null) ?? null}
        dineInEnabled={(restaurant.dine_in_enabled as boolean) ?? true}
        takeoutEnabled={(restaurant.takeout_enabled as boolean) ?? true}
        tables={(tables ?? []) as { id: string; code: string; label: string | null; seats: number }[]}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardBody>
    </Card>
  );
}
