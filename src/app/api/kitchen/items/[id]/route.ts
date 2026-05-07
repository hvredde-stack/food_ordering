// PATCH /api/kitchen/items/[id] — mark an order item preparing/ready/served/cancelled.
// Clerk-authed staff only; the item must belong to the staff's restaurant.

import { z } from "zod";
import { json, parseJson, forbidden, notFound, serverError, unauthorized } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  restaurantSlug: z.string().min(1),
  status: z.enum(["pending", "preparing", "ready", "served", "cancelled"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();

  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;
  if (parsed.data.restaurantSlug !== ctx.restaurant.slug) {
    return forbidden("Not your restaurant");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_items")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .eq("restaurant_id", ctx.restaurant.id)
    .select("*")
    .maybeSingle();
  if (error) return serverError(error.message);
  if (!data) return notFound("Order item not found");
  return json({ item: data });
}
