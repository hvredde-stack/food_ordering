// GET /api/admin/orders — recent orders for the admin's restaurant.

import { json, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*), table:restaurant_tables(id, code, label)")
    .eq("restaurant_id", ctx.restaurant.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return serverError(error.message);
  return json({ orders: data ?? [] });
}
