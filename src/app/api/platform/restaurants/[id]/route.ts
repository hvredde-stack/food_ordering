// GET   /api/platform/restaurants/[id] — full detail + analytics rollup.
// PATCH /api/platform/restaurants/[id] — toggle status, edit name/slug.

import { z } from "zod";
import { json, parseJson, unauthorized, notFound, serverError } from "@/lib/api";
import { getPlatformContext } from "@/lib/platform";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getPlatformContext();
  if (!ctx) return unauthorized("Platform admin only");

  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle();
  if (!restaurant) return notFound();

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: orders }, { data: sentiment }, { count: tableCount }, { count: dishCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("status, order_type, total_cents, created_at")
      .eq("restaurant_id", id)
      .gte("created_at", since30),
    supabase
      .from("sentiment_events")
      .select("kind")
      .eq("restaurant_id", id)
      .gte("created_at", since30),
    supabase.from("restaurant_tables").select("*", { count: "exact", head: true }).eq("restaurant_id", id),
    supabase.from("dishes").select("*", { count: "exact", head: true }).eq("restaurant_id", id),
  ]);

  const live = (orders ?? []).filter((o) => o.status !== "cancelled");
  const dineIn = live.filter((o) => o.order_type === "dine-in");
  const takeout = live.filter((o) => o.order_type === "takeout");

  return json({
    restaurant,
    counts: {
      tables: tableCount ?? 0,
      dishes: dishCount ?? 0,
    },
    last30d: {
      orders: live.length,
      revenue_cents: live.reduce((s, o) => s + ((o.total_cents as number) ?? 0), 0),
      dine_in_orders: dineIn.length,
      takeout_orders: takeout.length,
      happy: (sentiment ?? []).filter((s) => s.kind === "happy").length,
      sad: (sentiment ?? []).filter((s) => s.kind === "sad").length,
    },
  });
}

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getPlatformContext();
  if (!ctx) return unauthorized("Platform admin only");

  const parsed = await parseJson(req, PatchBody);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("restaurants")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return serverError(error.message);
  if (!data) return notFound();
  return json({ restaurant: data });
}
