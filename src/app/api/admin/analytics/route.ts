// GET /api/admin/analytics?days=7
// Returns: peak ordering hours, top dishes, daily volume, sentiment trend.

import { json, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const url = new URL(req.url);
  const days = Math.max(1, Math.min(Number(url.searchParams.get("days") ?? 7), 90));
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdmin();

  const [{ data: orders, error: oErr }, { data: items, error: iErr }, { data: sentiment, error: sErr }, { data: feedback }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("created_at, total_cents, status, order_type")
        .eq("restaurant_id", ctx.restaurant.id)
        .gte("created_at", sinceIso),
      supabase
        .from("order_items")
        .select("dish_name, dish_id, quantity, unit_price_cents, status, created_at")
        .eq("restaurant_id", ctx.restaurant.id)
        .gte("created_at", sinceIso),
      supabase
        .from("sentiment_events")
        .select("kind, created_at")
        .eq("restaurant_id", ctx.restaurant.id)
        .gte("created_at", sinceIso),
      supabase
        .from("feedback")
        .select("rating, comment, created_at")
        .eq("restaurant_id", ctx.restaurant.id)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
  if (oErr) return serverError(oErr.message);
  if (iErr) return serverError(iErr.message);
  if (sErr) return serverError(sErr.message);

  // Peak hours by hour-of-day.
  const peakByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue_cents: 0 }));
  for (const o of orders ?? []) {
    if (o.status === "cancelled") continue;
    const h = new Date(o.created_at as string).getHours();
    peakByHour[h].orders += 1;
    peakByHour[h].revenue_cents += (o.total_cents as number) ?? 0;
  }

  // Volume by day.
  const dayMap = new Map<string, { day: string; orders: number; revenue_cents: number }>();
  for (const o of orders ?? []) {
    if (o.status === "cancelled") continue;
    const d = (o.created_at as string).slice(0, 10);
    const row = dayMap.get(d) ?? { day: d, orders: 0, revenue_cents: 0 };
    row.orders += 1;
    row.revenue_cents += (o.total_cents as number) ?? 0;
    dayMap.set(d, row);
  }
  const volumeByDay = [...dayMap.values()].sort((a, b) => a.day.localeCompare(b.day));

  // Top dishes.
  const dishMap = new Map<string, { dish_id: string; dish_name: string; units: number; revenue_cents: number }>();
  for (const it of items ?? []) {
    if (it.status === "cancelled") continue;
    const key = it.dish_id as string;
    const row = dishMap.get(key) ?? {
      dish_id: key,
      dish_name: it.dish_name as string,
      units: 0,
      revenue_cents: 0,
    };
    row.units += (it.quantity as number) ?? 0;
    row.revenue_cents += ((it.quantity as number) ?? 0) * ((it.unit_price_cents as number) ?? 0);
    dishMap.set(key, row);
  }
  const topDishes = [...dishMap.values()].sort((a, b) => b.units - a.units).slice(0, 10);

  // Sentiment by day.
  const sentMap = new Map<string, { day: string; happy: number; sad: number }>();
  for (const ev of sentiment ?? []) {
    const d = (ev.created_at as string).slice(0, 10);
    const row = sentMap.get(d) ?? { day: d, happy: 0, sad: 0 };
    if (ev.kind === "happy") row.happy += 1;
    else row.sad += 1;
    sentMap.set(d, row);
  }
  const sentimentByDay = [...sentMap.values()].sort((a, b) => a.day.localeCompare(b.day));

  // Headline KPIs.
  const liveOrders = (orders ?? []).filter((o) => o.status !== "cancelled");
  const totalOrders = liveOrders.length;
  const totalRevenue = liveOrders.reduce((s, o) => s + ((o.total_cents as number) ?? 0), 0);
  const dineInOrders = liveOrders.filter((o) => o.order_type === "dine-in");
  const takeoutOrders = liveOrders.filter((o) => o.order_type === "takeout");
  const happyCount = (sentiment ?? []).filter((s) => s.kind === "happy").length;
  const sadCount = (sentiment ?? []).filter((s) => s.kind === "sad").length;
  const avgRating =
    (feedback ?? []).length > 0
      ? (feedback ?? []).reduce((s, f) => s + (f.rating as number), 0) / (feedback ?? []).length
      : null;

  return json({
    range: { days, since: sinceIso },
    kpis: {
      total_orders: totalOrders,
      total_revenue_cents: totalRevenue,
      dine_in_orders: dineInOrders.length,
      dine_in_revenue_cents: dineInOrders.reduce((s, o) => s + ((o.total_cents as number) ?? 0), 0),
      takeout_orders: takeoutOrders.length,
      takeout_revenue_cents: takeoutOrders.reduce((s, o) => s + ((o.total_cents as number) ?? 0), 0),
      happy: happyCount,
      sad: sadCount,
      avg_rating: avgRating,
    },
    peakByHour,
    volumeByDay,
    topDishes,
    sentimentByDay,
    recentFeedback: feedback ?? [],
  });
}
