// POST /api/admin/categories — create a menu category.
// Categories list is returned by /api/admin/dishes.

import { z } from "zod";
import { json, parseJson, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  name: z.string().min(1).max(80),
  position: z.number().int().optional(),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("menu_categories")
    .insert({ ...parsed.data, restaurant_id: ctx.restaurant.id })
    .select("*")
    .single();
  if (error) return serverError(error.message);
  return json({ category: data });
}
