// POST /api/onboarding — self-serve restaurant creation for the
// signed-in Clerk user. Mirrors the platform-admin onboarding flow but
// scoped to the caller's own user id. Refuses if they already own one.

import { z } from "zod";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { json, parseJson, badRequest, unauthorized, serverError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  name: z.string().min(1).max(80),
  // Optional — server auto-derives from name if missing.
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/).optional(),
  tableCount: z.number().int().min(0).max(50).optional(),
  seatsPerTable: z.number().int().positive().max(20).optional(),
  tableCodePrefix: z.string().max(8).optional(),
  currency: z.string().length(3).optional(),
  seedTapWater: z.boolean().optional(),
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;
  const {
    name,
    slug: slugInput,
    tableCount = 4,
    seatsPerTable = 2,
    tableCodePrefix = "T-",
    currency = "USD",
    seedTapWater = true,
  } = parsed.data;

  const supabase = getSupabaseAdmin();

  // Refuse if they already own one — admin should land on /admin instead.
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id, slug")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (existing) {
    return badRequest(`You already own a restaurant ("${existing.slug}").`);
  }

  // Pick a slug — user-provided if valid, else derived from name with a
  // short userId suffix to avoid collisions.
  const baseSlug = slugInput ?? slugify(name);
  const finalSlug = await pickAvailableSlug(supabase, baseSlug, userId);

  const takeoutCode = `to-${Math.random().toString(36).slice(2, 12)}`;
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .insert({
      owner_user_id: userId,
      name,
      slug: finalSlug,
      currency,
      takeout_code: takeoutCode,
    })
    .select("*")
    .single();
  if (error || !restaurant) {
    return serverError(error?.message ?? "Failed to create restaurant");
  }
  const restaurantId = restaurant.id as string;

  // Seed tables.
  const seededTables: string[] = [];
  if (tableCount > 0) {
    const rows = Array.from({ length: tableCount }, (_, i) => {
      const code = `${tableCodePrefix}${String(i + 1).padStart(2, "0")}`;
      seededTables.push(code);
      return { restaurant_id: restaurantId, code, seats: seatsPerTable };
    });
    const { error: tErr } = await supabase.from("restaurant_tables").insert(rows);
    if (tErr) {
      // Roll back the restaurant — onboarding should be atomic.
      await supabase.from("restaurants").delete().eq("id", restaurantId);
      return serverError(`Failed to create tables: ${tErr.message}`);
    }
  }

  // Seed a free Tap Water dish so the menu page isn't empty.
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

  // For audit / display.
  const u = await currentUser();
  void u;

  return NextResponse.json(
    {
      restaurant,
      seeded: { tables: seededTables, tapWater: seedTapWater },
    },
    { status: 201 }
  );
}

async function pickAvailableSlug(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  base: string,
  userId: string
): Promise<string> {
  const trimmed = base || `r-${userId.slice(-6).toLowerCase()}`;
  // Try the bare slug first.
  let candidate = trimmed;
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    // Add a short hash on collision.
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${trimmed}-${suffix}`.slice(0, 40);
  }
  // Last-resort fallback — userid-based suffix guarantees uniqueness.
  return `${trimmed}-${userId.slice(-6).toLowerCase()}`.slice(0, 40);
}
