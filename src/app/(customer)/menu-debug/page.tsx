// TEMPORARY: same code path as /menu but wraps everything to surface the error.
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function MenuDebug() {
  const out: Record<string, unknown> = {};
  try {
    out.step = "calling getActiveSession";
    const session = await getActiveSession();
    out.session_present = !!session;
    if (!session) return <pre>{JSON.stringify(out, null, 2)}</pre>;
    out.session_id = session.id;

    out.step = "fetching restaurant + table + categories + dishes";
    const supabase = getSupabaseAdmin();
    const [{ data: restaurant }, { data: table }, { data: categories }, { data: dishes }] =
      await Promise.all([
        supabase.from("restaurants").select("id, slug, name, currency").eq("id", session.restaurant_id).single(),
        supabase.from("restaurant_tables").select("id, code, label").eq("id", session.table_id).single(),
        supabase.from("menu_categories").select("*").eq("restaurant_id", session.restaurant_id).order("position"),
        supabase.from("dishes").select("*").eq("restaurant_id", session.restaurant_id).eq("available", true).order("position"),
      ]);

    out.restaurant_ok = !!restaurant;
    out.table_ok = !!table;
    out.categories_count = categories?.length ?? null;
    out.dishes_count = dishes?.length ?? null;

    out.step = "all queries succeeded";
    return <pre>{JSON.stringify(out, null, 2)}</pre>;
  } catch (e) {
    out.threw = true;
    out.error_name = (e as Error).name;
    out.error_message = (e as Error).message;
    out.error_stack = ((e as Error).stack ?? "").split("\n").slice(0, 12).join("\n");
    return (
      <div style={{ padding: 20 }}>
        <h1>Debug error</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(out, null, 2)}</pre>
      </div>
    );
  }
}
