// GET /api/sessions/shared
// Returns all active orders at the customer's table (dine-in) or takeout
// group (takeout), grouped by session/customer. Drives the live "shared view".

import { json, unauthorized } from "@/lib/api";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getActiveSession();
  if (!session) return unauthorized("No active session");

  const supabase = getSupabaseAdmin();
  let orderQuery = supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("restaurant_id", session.restaurant_id)
    .order("created_at", { ascending: true });

  if (session.order_type === "dine-in" && session.table_id) {
    orderQuery = orderQuery.eq("table_id", session.table_id);
  } else if (session.order_type === "takeout" && session.takeout_code) {
    orderQuery = orderQuery
      .eq("takeout_code", session.takeout_code)
      // Time-window so we only show "currently active" takeout activity.
      .gte("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
  } else {
    return json({ orders: [] });
  }

  const { data: orders } = await orderQuery;
  return json({
    you: {
      session_id: session.id,
      customer_name: session.customer_name,
      order_type: session.order_type,
    },
    orders: orders ?? [],
  });
}
