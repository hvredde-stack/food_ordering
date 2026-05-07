import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TablesManager } from "./tables-manager";

export default async function AdminTablesPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/sign-in");

  const supabase = getSupabaseAdmin();
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", ctx.restaurant.id)
    .order("code");

  return (
    <TablesManager
      restaurantSlug={ctx.restaurant.slug}
      initialTables={(tables ?? []) as any}
    />
  );
}
