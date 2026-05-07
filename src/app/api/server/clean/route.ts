// POST /api/server/clean — staff scans a table QR and marks it cleaned.
// Body: { restaurantSlug, tableCode, staffName? }
// Clerk-authed; the slug must match the staff member's restaurant.

import { z } from "zod";
import { json, parseJson, notFound, serverError, unauthorized, forbidden } from "@/lib/api";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/auth";
import { cleanTableSessions } from "@/lib/session";

const Body = z.object({
  restaurantSlug: z.string().min(1),
  tableCode: z.string().min(1),
  staffName: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();

  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;
  if (parsed.data.restaurantSlug !== ctx.restaurant.slug) {
    return forbidden("This QR is for a different restaurant.");
  }

  const supabase = getSupabaseAdmin();
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, code, label")
    .eq("restaurant_id", ctx.restaurant.id)
    .eq("code", parsed.data.tableCode)
    .maybeSingle();
  if (!table) return notFound("Table not found");

  // Tag the cleaning event with the Clerk user id for an audit trail; the
  // human-readable label comes from the request body or the Clerk profile.
  let label = parsed.data.staffName;
  if (!label) {
    const user = await currentUser();
    label = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "staff";
  }
  const staffUserId = `${userId}|${label}`;

  try {
    const cleared = await cleanTableSessions({
      restaurantId: ctx.restaurant.id,
      tableId: table.id as string,
      staffUserId,
    });
    return json({
      ok: true,
      sessionsCleared: cleared,
      table,
      restaurant: { id: ctx.restaurant.id, name: ctx.restaurant.name, slug: ctx.restaurant.slug },
    });
  } catch (err) {
    return serverError((err as Error).message);
  }
}
