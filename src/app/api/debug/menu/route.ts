// TEMPORARY DEBUG — mimics /menu's data-fetch path so we can see the
// real error instead of Next's generic SSR exception page. Delete after fix.

import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    const session = await getActiveSession();
    out.session_present = !!session;
    if (!session) return NextResponse.json(out);
    out.session_summary = {
      id: session.id,
      restaurant_id: session.restaurant_id,
      table_id: session.table_id,
      takeout_code: session.takeout_code,
      order_type: session.order_type,
      customer_name: session.customer_name,
    };

    const supabase = getSupabaseAdmin();
    const r = await supabase
      .from("restaurants")
      .select("id, slug, name, currency")
      .eq("id", session.restaurant_id)
      .single();
    out.restaurant = { data: r.data, error: r.error?.message };

    const t = session.table_id
      ? await supabase
          .from("restaurant_tables")
          .select("id, code, label")
          .eq("id", session.table_id)
          .single()
      : { data: null, error: { message: "no table_id (takeout session)" } };
    out.table = { data: t.data, error: t.error?.message };

    const c = await supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", session.restaurant_id)
      .order("position");
    out.categories_count = c.data?.length ?? null;
    out.categories_error = c.error?.message ?? null;

    const d = await supabase
      .from("dishes")
      .select("*")
      .eq("restaurant_id", session.restaurant_id)
      .eq("available", true)
      .order("position");
    out.dishes_count = d.data?.length ?? null;
    out.dishes_error = d.error?.message ?? null;
  } catch (e) {
    out.thrown = true;
    out.error_name = (e as Error).name;
    out.error_message = (e as Error).message;
    out.error_stack = ((e as Error).stack ?? "").split("\n").slice(0, 6).join("\n");
  }
  return NextResponse.json(out);
}
