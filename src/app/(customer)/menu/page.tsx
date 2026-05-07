import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MenuView } from "./menu-view";
import { SentimentButtons } from "@/components/customer/sentiment-buttons";

export default async function MenuPage() {
  const session = await getActiveSession();
  if (!session) redirect("/");

  const supabase = getSupabaseAdmin();
  const [{ data: restaurant }, { data: categories }, { data: dishes }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, slug, name, currency")
      .eq("id", session.restaurant_id)
      .single(),
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", session.restaurant_id)
      .order("position"),
    supabase
      .from("dishes")
      .select("*")
      .eq("restaurant_id", session.restaurant_id)
      .eq("available", true)
      .order("position"),
  ]);

  if (!restaurant) redirect("/");

  // Table only exists for dine-in sessions; takeout has no table.
  let table: { id: string; code: string; label: string | null } | null = null;
  if (session.order_type === "dine-in" && session.table_id) {
    const { data } = await supabase
      .from("restaurant_tables")
      .select("id, code, label")
      .eq("id", session.table_id)
      .single();
    table = data as typeof table;
  }

  return (
    <>
      <MenuView
        restaurant={restaurant as any}
        table={table as any}
        orderType={session.order_type}
        categories={categories ?? []}
        dishes={dishes ?? []}
      />
      <SentimentButtons />
    </>
  );
}
