// GET /api/admin/tables — list tables for the admin's restaurant.
// POST /api/admin/tables — create a new table.

import { z } from "zod";
import { json, parseJson, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", ctx.restaurant.id)
    .order("code");
  if (error) return serverError(error.message);
  return json({ tables: data ?? [], restaurant: ctx.restaurant });
}

const PostBody = z.object({
  code: z.string().min(1).max(20),
  label: z.string().max(80).optional(),
  seats: z.number().int().positive().max(50).default(2),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, PostBody);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({ ...parsed.data, restaurant_id: ctx.restaurant.id })
    .select("*")
    .single();
  if (error) return serverError(error.message);
  return json({ table: data });
}
