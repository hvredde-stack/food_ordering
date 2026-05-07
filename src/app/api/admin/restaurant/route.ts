// GET   /api/admin/restaurant — return the signed-in user's restaurant.
// PATCH /api/admin/restaurant — update name/slug/etc.
//
// The restaurant is created via /api/onboarding (self-serve) or
// /api/platform/restaurants (platform admin onboards). This endpoint
// returns 404 if no restaurant is linked yet.

import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { json, parseJson, unauthorized, serverError, badRequest } from "@/lib/api";
import { getOwnedRestaurant, getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isReservedSlug, RESERVED_SLUG_HINT } from "@/lib/reserved-slugs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const restaurant = await getOwnedRestaurant(userId);
  if (!restaurant) {
    return NextResponse.json(
      { error: "No restaurant linked to this account. Visit /onboarding to set one up." },
      { status: 404 }
    );
  }
  return json({ restaurant });
}

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
  dine_in_enabled: z.boolean().optional(),
  takeout_enabled: z.boolean().optional(),
  // Setting takeout_code regenerates the master takeout QR.
  regenerate_takeout_code: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, PatchBody);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { regenerate_takeout_code, ...rest } = parsed.data;
  if (rest.slug && isReservedSlug(rest.slug)) {
    return badRequest(`Slug "${rest.slug}" is reserved. ${RESERVED_SLUG_HINT}`);
  }
  const updates: Record<string, unknown> = { ...rest };
  if (regenerate_takeout_code) {
    updates.takeout_code = `to-${Math.random().toString(36).slice(2, 12)}`;
  }
  const { data, error } = await supabase
    .from("restaurants")
    .update(updates)
    .eq("id", ctx.restaurant.id)
    .select("*")
    .single();
  if (error) return serverError(error.message);
  return json({ restaurant: data });
}
