// GET /api/sessions/me — fetch current session + table + active orders.
// DELETE /api/sessions/me — close the session (used after feedback).

import { json, unauthorized, serverError } from "@/lib/api";
import { getActiveSession, clearSessionCookie } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getActiveSession();
  if (!session) return unauthorized("No active session");

  const supabase = getSupabaseAdmin();
  const [{ data: table }, { data: restaurant }, { data: orders }] = await Promise.all([
    supabase.from("restaurant_tables").select("id, code, label").eq("id", session.table_id).maybeSingle(),
    supabase.from("restaurants").select("id, slug, name, currency").eq("id", session.restaurant_id).maybeSingle(),
    supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false }),
  ]);

  return json({
    session: {
      id: session.id,
      restaurant_id: session.restaurant_id,
      table_id: session.table_id,
      status: session.status,
      expires_at: session.expires_at,
      customer_name: session.customer_name,
      party_size: session.party_size,
    },
    restaurant,
    table,
    orders: orders ?? [],
  });
}

export async function DELETE() {
  const session = await getActiveSession();
  if (!session) {
    await clearSessionCookie();
    return json({ ok: true });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("customer_sessions")
    .update({ status: "expired" })
    .eq("id", session.id);
  if (error) return serverError(error.message);
  await clearSessionCookie();
  return json({ ok: true });
}
