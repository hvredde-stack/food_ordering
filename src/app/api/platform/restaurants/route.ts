// GET  /api/platform/restaurants — list all restaurants with rollup stats.
// POST /api/platform/restaurants — onboard a new restaurant for an existing Clerk user (lookup by email).

import { z } from "zod";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { json, parseJson, unauthorized, badRequest, serverError } from "@/lib/api";
import { getPlatformContext } from "@/lib/platform";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isReservedSlug } from "@/lib/reserved-slugs";

export async function GET() {
  const ctx = await getPlatformContext();
  if (!ctx) return unauthorized("Platform admin only");

  const supabase = getSupabaseAdmin();

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: restaurants }, { data: orders30d }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("restaurant_id, total_cents, status, created_at")
      .gte("created_at", since30d),
  ]);

  // Roll up per-restaurant.
  const stats = new Map<string, { orders30d: number; revenue30d: number; lastOrderAt: string | null }>();
  for (const o of orders30d ?? []) {
    if (o.status === "cancelled") continue;
    const k = o.restaurant_id as string;
    const row = stats.get(k) ?? { orders30d: 0, revenue30d: 0, lastOrderAt: null };
    row.orders30d += 1;
    row.revenue30d += (o.total_cents as number) ?? 0;
    if (!row.lastOrderAt || (o.created_at as string) > row.lastOrderAt) {
      row.lastOrderAt = o.created_at as string;
    }
    stats.set(k, row);
  }

  const enriched = (restaurants ?? []).map((r) => ({
    ...r,
    stats: stats.get(r.id as string) ?? { orders30d: 0, revenue30d: 0, lastOrderAt: null },
  }));

  return json({ restaurants: enriched });
}

const PostBody = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, "lowercase letters, digits, dashes only"),
  ownerEmail: z.string().email(),
  currency: z.string().length(3).optional(),
  // Initial seeding so every URL works immediately after onboarding.
  tableCount: z.number().int().min(0).max(50).optional(),
  seatsPerTable: z.number().int().positive().max(20).optional(),
  tableCodePrefix: z.string().max(8).optional(),
  seedTapWater: z.boolean().optional(),
});

export async function POST(req: Request) {
  const ctx = await getPlatformContext();
  if (!ctx) return unauthorized("Platform admin only");

  const parsed = await parseJson(req, PostBody);
  if (!parsed.ok) return parsed.response;
  const {
    name,
    slug,
    ownerEmail,
    currency,
    tableCount = 4,
    seatsPerTable = 2,
    tableCodePrefix = "T-",
    seedTapWater = true,
  } = parsed.data;

  // Look up Clerk user by email (must already exist).
  const cc = await clerkClient();
  const { data: users } = await cc.users.getUserList({ emailAddress: [ownerEmail] });
  if (!users || users.length === 0) {
    return badRequest(
      `No Clerk user found with email ${ownerEmail}. Ask the owner to sign up at /admin/sign-up first, then onboard them here.`
    );
  }
  const ownerUserId = users[0].id;

  const supabase = getSupabaseAdmin();
  // Reserved slugs collide with global routes (admin, platform, api, ...).
  if (isReservedSlug(slug)) {
    return badRequest(`Slug "${slug}" is reserved by the platform. Pick another.`);
  }
  // Prevent duplicate slug.
  const { data: dupe } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
  if (dupe) return badRequest(`Slug "${slug}" is already in use.`);

  // One owner per restaurant in v1: refuse if this user already owns one.
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id, slug")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (existing) {
    return badRequest(`That user already owns restaurant "${existing.slug}".`);
  }

  const takeoutCode = `to-${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      owner_user_id: ownerUserId,
      name,
      slug,
      currency: currency ?? "USD",
      takeout_code: takeoutCode,
    })
    .select("*")
    .single();
  if (error || !data) return serverError(error?.message ?? "Failed to create restaurant");

  const restaurantId = data.id as string;

  // Seed tables: T-01 ... T-N (or whatever prefix the platform admin chose).
  const seededTables: string[] = [];
  if (tableCount > 0) {
    const rows = Array.from({ length: tableCount }, (_, i) => {
      const code = `${tableCodePrefix}${String(i + 1).padStart(2, "0")}`;
      seededTables.push(code);
      return {
        restaurant_id: restaurantId,
        code,
        seats: seatsPerTable,
      };
    });
    const { error: tErr } = await supabase.from("restaurant_tables").insert(rows);
    if (tErr) {
      // Roll back the restaurant — orphan tables aren't fatal but onboarding should be atomic.
      await supabase.from("restaurants").delete().eq("id", restaurantId);
      return serverError(`Failed to create tables: ${tErr.message}`);
    }
  }

  // Seed a single starter dish so the menu page isn't empty for testing.
  if (seedTapWater) {
    await supabase.from("dishes").insert({
      restaurant_id: restaurantId,
      name: "Tap Water",
      description: "Free with every meal.",
      price_cents: 0,
      available: true,
      position: 0,
    });
  }

  return NextResponse.json(
    {
      restaurant: data,
      owner: { id: ownerUserId, email: ownerEmail },
      seeded: { tables: seededTables, tapWater: seedTapWater },
    },
    { status: 201 }
  );
}
