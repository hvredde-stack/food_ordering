// GET /api/kitchen/orders?restaurant=<slug>
// Clerk-authed staff only. The slug must match the staff member's restaurant.

import { json, badRequest, forbidden, notFound, serverError, unauthorized } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();

  const url = new URL(req.url);
  const slug = url.searchParams.get("restaurant");
  if (!slug) return badRequest("Missing 'restaurant' query parameter");
  if (slug !== ctx.restaurant.slug) return forbidden("Not your restaurant");

  const supabase = getSupabaseAdmin();
  const restaurant = ctx.restaurant;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*), table:restaurant_tables(id, code, label)")
    .eq("restaurant_id", restaurant.id)
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) return serverError(error.message);

  const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: sentiment } = await supabase
    .from("sentiment_events")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });

  return json({
    restaurant: { id: restaurant.id, name: restaurant.name, currency: restaurant.currency },
    orders: orders ?? [],
    sentiment: sentiment ?? [],
  });
}
