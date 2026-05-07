// GET /api/menu?restaurant=<slug>  — public menu (categories + dishes).

import { json, badRequest, notFound, serverError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("restaurant");
  if (!slug) return badRequest("Missing 'restaurant' query parameter");

  const supabase = getSupabaseAdmin();
  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select("id, slug, name, description, logo_url, currency")
    .eq("slug", slug)
    .maybeSingle();
  if (rErr) return serverError(rErr.message);
  if (!restaurant) return notFound("Restaurant not found");

  const [{ data: categories }, { data: dishes }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("position"),
    supabase
      .from("dishes")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("available", true)
      .order("position"),
  ]);

  return json({ restaurant, categories: categories ?? [], dishes: dishes ?? [] });
}
