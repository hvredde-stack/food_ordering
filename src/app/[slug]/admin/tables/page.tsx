import { redirect } from "next/navigation";
import { getRestaurantAccess } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TablesManager } from "./tables-manager";

export default async function AdminTablesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getRestaurantAccess(slug);
  if (!ctx) redirect("/admin/sign-in");

  const supabase = getSupabaseAdmin();

  // Pre-load tables + every customer session tied to a table for this
  // restaurant. The TablesManager merges them client-side (and re-fetches
  // every 8 s so the badges stay fresh) — but doing it here too gives a
  // correct first paint, no flash of "Available" on actually-occupied
  // tables.
  const [{ data: tables }, { data: sessions }] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("*")
      .eq("restaurant_id", ctx.restaurant.id)
      .order("code"),
    supabase
      .from("customer_sessions")
      .select("id, table_id, customer_name, party_size, created_at, last_active_at, status, cleaned_at")
      .eq("restaurant_id", ctx.restaurant.id)
      .not("table_id", "is", null),
  ]);

  const tablesWithStatus = (tables ?? []).map((t) => {
    let active: any = null;
    let lastCleanedAt: string | null = null;
    for (const s of sessions ?? []) {
      if (s.table_id !== t.id) continue;
      if (s.status === "active" && !active) active = s;
      else if (s.status === "cleaned" && s.cleaned_at) {
        if (!lastCleanedAt || (s.cleaned_at as string) > lastCleanedAt) {
          lastCleanedAt = s.cleaned_at as string;
        }
      }
    }
    return { ...t, occupancy: active, last_cleaned_at: lastCleanedAt };
  });

  return (
    <TablesManager
      restaurantSlug={ctx.restaurant.slug}
      initialTables={tablesWithStatus as any}
    />
  );
}
