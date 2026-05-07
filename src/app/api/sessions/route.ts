// POST /api/sessions — start a customer session at a table.

import { z } from "zod";
import { json, badRequest, notFound, parseJson, serverError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSession } from "@/lib/session";

const Body = z.object({
  restaurantSlug: z.string().min(1),
  tableCode: z.string().min(1),
  partySize: z.number().int().positive().max(50).optional(),
  customerName: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();

  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", parsed.data.restaurantSlug)
    .maybeSingle();
  if (rErr) return serverError(rErr.message);
  if (!restaurant) return notFound("Restaurant not found");

  const { data: table, error: tErr } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .ilike("code", parsed.data.tableCode)
    .maybeSingle();
  if (tErr) return serverError(tErr.message);
  if (!table) return notFound("Table not found");

  try {
    const session = await createSession({
      restaurantId: restaurant.id as string,
      tableId: table.id as string,
      partySize: parsed.data.partySize,
      customerName: parsed.data.customerName,
    });
    // Don't echo the token; the cookie carries it.
    const { token: _t, ...safe } = session;
    return json({ session: safe });
  } catch (err) {
    return badRequest((err as Error).message);
  }
}
