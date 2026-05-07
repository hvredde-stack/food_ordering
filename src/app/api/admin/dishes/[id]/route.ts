// PATCH /api/admin/dishes/[id] — update dish.
// DELETE /api/admin/dishes/[id] — remove dish.

import { z } from "zod";
import { json, parseJson, unauthorized, notFound, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PRICE_UNITS = ["each", "lb", "kg", "oz", "g"] as const;

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  price_cents: z.number().int().nonnegative().optional(),
  price_unit: z.enum(PRICE_UNITS).optional(),
  image_url: z.string().url().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  available: z.boolean().optional(),
  position: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, PatchBody);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dishes")
    .update(parsed.data)
    .eq("id", id)
    .eq("restaurant_id", ctx.restaurant.id)
    .select("*")
    .maybeSingle();
  if (error) return serverError(error.message);
  if (!data) return notFound();
  return json({ dish: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("dishes")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", ctx.restaurant.id);
  if (error) return serverError(error.message);
  return json({ ok: true });
}
