// GET /api/sessions/shared
// Returns the orders the current customer should see in their session view:
//
//   • Dine-in: orders at the same table whose session has NOT been cleaned.
//     A "cleaned" session means staff scanned that table to reset it for the
//     next party — older orders shouldn't follow them onto a new customer.
//
//   • Takeout: orders sharing the same takeout group, time-windowed to the
//     last 2 hours so we don't show yesterday's pickups.

import { json, unauthorized } from "@/lib/api";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getActiveSession();
  if (!session) return unauthorized("No active session");

  const supabase = getSupabaseAdmin();

  if (session.order_type === "dine-in" && session.table_id) {
    // 1. Find sessions at this table that have NOT been cleaned.
    const { data: liveSessions } = await supabase
      .from("customer_sessions")
      .select("id")
      .eq("table_id", session.table_id)
      .is("cleaned_at", null);
    const ids = (liveSessions ?? []).map((s) => s.id as string);
    if (ids.length === 0) {
      return json({ you: youPayload(session), orders: [] });
    }
    const { data: orders } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("restaurant_id", session.restaurant_id)
      .in("session_id", ids)
      .order("created_at", { ascending: true });
    return json({ you: youPayload(session), orders: orders ?? [] });
  }

  if (session.order_type === "takeout" && session.takeout_code) {
    const sinceIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: orders } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("restaurant_id", session.restaurant_id)
      .eq("takeout_code", session.takeout_code)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true });
    return json({ you: youPayload(session), orders: orders ?? [] });
  }

  return json({ you: youPayload(session), orders: [] });
}

function youPayload(session: { id: string; customer_name: string | null; order_type: string }) {
  return {
    session_id: session.id,
    customer_name: session.customer_name,
    order_type: session.order_type,
  };
}
