import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getRestaurantAccess } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ServerApp } from "./server-app";

export default async function ServerHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await getRestaurantAccess(slug);
  if (!access) redirect("/admin/sign-in");
  const { restaurant } = access;

  const user = await currentUser();
  const displayName =
    user?.firstName ||
    user?.username ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "staff";

  // SSR the table list with occupancy so the staff sees current state on
  // first paint instead of a momentary "Available" flash on tables that
  // are actually occupied. The client polls every 8 s after that.
  const supabase = getSupabaseAdmin();
  const [{ data: tables }, { data: sessions }] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("id, code, label, seats")
      .eq("restaurant_id", restaurant.id)
      .order("code"),
    supabase
      .from("customer_sessions")
      .select("id, table_id, customer_name, party_size, created_at, status, cleaned_at")
      .eq("restaurant_id", restaurant.id)
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
    <ServerApp
      restaurantSlug={restaurant.slug}
      restaurantName={restaurant.name}
      staffDisplayName={displayName}
      initialTables={tablesWithStatus as any}
    />
  );
}
