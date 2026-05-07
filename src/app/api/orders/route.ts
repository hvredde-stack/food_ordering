// POST /api/orders — place an order from the active customer session.

import { z } from "zod";
import { json, badRequest, unauthorized, serverError, parseJson } from "@/lib/api";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PRICE_UNITS = ["each", "lb", "kg", "oz", "g"] as const;

const Body = z.object({
  items: z
    .array(
      z.object({
        dishId: z.string().uuid(),
        // Decimal allowed for weight-priced dishes. Server validates the
        // unit matches the dish's price_unit and rejects mismatches.
        quantity: z.number().positive().max(1000),
        unit: z.enum(PRICE_UNITS).optional(),
        notes: z.string().max(200).optional(),
      })
    )
    .min(1),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await getActiveSession();
  if (!session) return unauthorized("No active session");

  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();

  const dishIds = [...new Set(parsed.data.items.map((i) => i.dishId))];
  const { data: dishes, error: dErr } = await supabase
    .from("dishes")
    .select("id, name, price_cents, price_unit, available, restaurant_id")
    .in("id", dishIds);
  if (dErr) return serverError(dErr.message);

  // All dishes must belong to this restaurant and be available; the
  // client-supplied unit (when present) must match the dish.
  const byId = new Map((dishes ?? []).map((d) => [d.id as string, d]));
  for (const item of parsed.data.items) {
    const d = byId.get(item.dishId);
    if (!d) return badRequest(`Dish ${item.dishId} not found`);
    if (d.restaurant_id !== session.restaurant_id) return badRequest("Dish not in this restaurant");
    if (!d.available) return badRequest(`Dish "${d.name}" is unavailable`);
    const dishUnit = (d.price_unit as string | null) ?? "each";
    if (item.unit && item.unit !== dishUnit) {
      return badRequest(`Dish "${d.name}" is sold by ${dishUnit}, not ${item.unit}`);
    }
    // For "each" dishes, refuse fractional quantities — they don't make sense.
    if (dishUnit === "each" && !Number.isInteger(item.quantity)) {
      return badRequest(`Dish "${d.name}" can only be ordered in whole units`);
    }
  }

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      restaurant_id: session.restaurant_id,
      table_id: session.table_id,
      takeout_code: session.takeout_code,
      session_id: session.id,
      order_type: session.order_type,
      customer_name: session.customer_name,
      status: "pending",
      total_cents: 0,
      notes: parsed.data.notes ?? null,
    })
    .select("*")
    .single();
  if (oErr || !order) return serverError(oErr?.message ?? "Failed to create order");

  const itemRows = parsed.data.items.map((i) => {
    const d = byId.get(i.dishId)!;
    const unit = ((d.price_unit as string | null) ?? "each") as
      | "each" | "lb" | "kg" | "oz" | "g";
    return {
      order_id: order.id,
      restaurant_id: session.restaurant_id,
      dish_id: i.dishId,
      dish_name: d.name as string,
      unit_price_cents: d.price_cents as number,
      quantity: i.quantity,
      unit,
      notes: i.notes ?? null,
      status: "pending" as const,
      // Per-person attribution (snapshot from session at order time).
      customer_name: session.customer_name,
    };
  });

  const { error: iErr } = await supabase.from("order_items").insert(itemRows);
  if (iErr) {
    // Rollback: cascade delete via the order.
    await supabase.from("orders").delete().eq("id", order.id);
    return serverError(iErr.message);
  }

  // Re-fetch with items (the trigger has now computed total + status).
  const { data: full } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", order.id)
    .single();

  return json({ order: full });
}
