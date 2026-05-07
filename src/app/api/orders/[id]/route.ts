// GET /api/orders/[id] — current order + items. Customer scope only.

import { json, unauthorized, notFound } from "@/lib/api";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getActiveSession();
  if (!session) return unauthorized("No active session");

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .eq("session_id", session.id)
    .maybeSingle();
  if (!data) return notFound("Order not found");
  return json({ order: data });
}
