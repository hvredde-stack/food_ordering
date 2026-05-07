import Link from "next/link";
import { redirect } from "next/navigation";
import { getRestaurantAccess } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { formatMoney } from "@/lib/utils";

export default async function AdminOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Platform admins are first-class viewers here too: getRestaurantAccess
  // returns truthy for the owner OR any platform admin. The /admin shim
  // handles the "where do I go after sign-in" routing — if you got here,
  // you typed (or were sent to) a tenant URL deliberately.
  const access = await getRestaurantAccess(slug);
  if (!access) redirect("/admin/sign-in");
  const { restaurant } = access;

  const supabase = getSupabaseAdmin();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: orders24h }, { data: dishes }, { data: tables }, { data: sentiment24h }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_cents, status")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", sinceIso),
    supabase.from("dishes").select("id").eq("restaurant_id", restaurant.id),
    supabase.from("restaurant_tables").select("id").eq("restaurant_id", restaurant.id),
    supabase
      .from("sentiment_events")
      .select("kind")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", sinceIso),
  ]);

  const totalRevenue = (orders24h ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + ((o.total_cents as number) ?? 0), 0);
  const happy = (sentiment24h ?? []).filter((s) => s.kind === "happy").length;
  const sad   = (sentiment24h ?? []).filter((s) => s.kind === "sad").length;

  const ordersCount = (orders24h ?? []).filter((o) => o.status !== "cancelled").length;
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      <PageHeader
        eyebrow="Overview"
        title={restaurant.name}
        lede={
          <>
            <span className="font-mono text-xs tracking-[0.14em]">/{restaurant.slug}</span>
            <span className="mx-2 opacity-40">·</span>
            <span className="font-mono text-xs tracking-[0.14em]">{restaurant.currency}</span>
          </>
        }
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 border border-border">
        <Stat label="Orders · 24h" value={ordersCount.toLocaleString()} hint="cancelled excluded" />
        <Stat label="Revenue · 24h" value={formatMoney(totalRevenue, restaurant.currency)} hint={restaurant.currency} />
        <Stat label="Dishes" value={(dishes ?? []).length} hint="on the menu" />
        <Stat label="Tables" value={(tables ?? []).length} hint="active QR codes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><div className="font-semibold">Sentiment (24h)</div></CardHeader>
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
          <CardHeader><div className="font-semibold">Quick links</div></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <QuickLink href={`/${slug}/admin/menu`}     label="Manage menu" />
            <QuickLink href={`/${slug}/admin/tables`}   label="Manage tables & QR codes" />
            <QuickLink href={`/${slug}/admin/orders`}   label="View live orders" />
            <QuickLink href={`/${slug}/kitchen`}        label="Open kitchen dashboard" external />
            <QuickLink href={`/${slug}/t`}              label="Customer scan landing (preview)" external />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <Link href={href} className="block px-3 py-2 rounded-lg hover:bg-muted">
      {label} {external && <span className="text-muted">↗</span>}
    </Link>
  );
}
