// POST /api/sessions — start a customer session.
//   - dine-in:  body { mode: "dine-in",  restaurantSlug, tableCode,    partySize?, customerName? }
//   - takeout:  body { mode: "takeout",  restaurantSlug, takeoutCode,                customerName? }
//
// `customerName` is required when starting a takeout session (per the spec —
// each person enters their own name) but optional for dine-in (matches v1 behavior).

import { z } from "zod";
import { json, badRequest, notFound, parseJson, serverError, forbidden } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSession } from "@/lib/session";

const Body = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("dine-in"),
    restaurantSlug: z.string().min(1),
    tableCode: z.string().min(1),
    partySize: z.number().int().positive().max(50).optional(),
    customerName: z.string().max(80).optional(),
  }),
  z.object({
    mode: z.literal("takeout"),
    restaurantSlug: z.string().min(1),
    takeoutCode: z.string().min(1),
    customerName: z.string().min(1).max(80),
  }),
]);

export async function POST(req: Request) {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const supabase = getSupabaseAdmin();
  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select("id, dine_in_enabled, takeout_enabled, takeout_code, status")
    .eq("slug", body.restaurantSlug)
    .maybeSingle();
  if (rErr) return serverError(rErr.message);
  if (!restaurant) return notFound("Restaurant not found");
  if (restaurant.status === "suspended") {
    return forbidden("This restaurant is currently unavailable. Please check back later.");
  }

  if (body.mode === "dine-in") {
    if (!restaurant.dine_in_enabled) return forbidden("Dine-in is currently disabled.");
    const { data: table, error: tErr } = await supabase
      .from("restaurant_tables")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .ilike("code", body.tableCode)
      .maybeSingle();
    if (tErr) return serverError(tErr.message);
    if (!table) return notFound("Table not found");

    try {
      const session = await createSession({
        kind: "dine-in",
        restaurantId: restaurant.id as string,
        tableId: table.id as string,
        partySize: body.partySize,
        customerName: body.customerName,
      });
      const { token: _t, ...safe } = session;
      return json({ session: safe });
    } catch (err) {
      return badRequest((err as Error).message);
    }
  }

  // Takeout
  if (!restaurant.takeout_enabled) return forbidden("Takeout is currently disabled.");
  if (restaurant.takeout_code !== body.takeoutCode) return notFound("Invalid takeout code");

  try {
    const session = await createSession({
      kind: "takeout",
      restaurantId: restaurant.id as string,
      takeoutCode: body.takeoutCode,
      customerName: body.customerName,
    });
    const { token: _t, ...safe } = session;
    return json({ session: safe });
  } catch (err) {
    return badRequest((err as Error).message);
  }
}
