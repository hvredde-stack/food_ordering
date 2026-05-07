import { redirect } from "next/navigation";
import { getRestaurantAccess } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MenuManager } from "./menu-manager";

export default async function AdminMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getRestaurantAccess(slug);
  if (!ctx) redirect("/admin/sign-in");

  const supabase = getSupabaseAdmin();
  const [{ data: dishes }, { data: categories }] = await Promise.all([
    supabase
      .from("dishes")
      .select("*")
      .eq("restaurant_id", ctx.restaurant.id)
      .order("position"),
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", ctx.restaurant.id)
      .order("position"),
  ]);

  return (
    <MenuManager
      currency={ctx.restaurant.currency}
      initialDishes={(dishes ?? []) as any}
      initialCategories={(categories ?? []) as any}
    />
  );
}
