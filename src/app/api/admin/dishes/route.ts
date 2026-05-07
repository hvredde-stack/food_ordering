// GET /api/admin/dishes — list dishes + categories for the current admin's restaurant.
// POST /api/admin/dishes — create a new dish.

import { z } from "zod";
import { json, parseJson, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();

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
  return json({ dishes: dishes ?? [], categories: categories ?? [] });
}

const PostBody = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  price_cents: z.number().int().nonnegative(),
  image_url: z.string().url().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  available: z.boolean().optional(),
  position: z.number().int().optional(),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, PostBody);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dishes")
    .insert({ ...parsed.data, restaurant_id: ctx.restaurant.id })
    .select("*")
    .single();
  if (error) return serverError(error.message);
  return json({ dish: data });
}
