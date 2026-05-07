// Admin auth: load the Clerk-authenticated user's restaurant.
// Owners are linked via restaurants.owner_user_id == clerk_user_id.

import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlatformContext } from "@/lib/platform";
import type { Restaurant } from "@/lib/types";

export async function getAdminContext(): Promise<{
  userId: string;
  restaurant: Restaurant;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return { userId, restaurant: data as Restaurant };
}

/**
 * Bootstraps a restaurant for a freshly-signed-up admin who doesn't
 * yet own one. Idempotent: returns the existing record if present.
 *
 * Returns null when the user is a platform admin — they shouldn't get
 * a fake restaurant attached to them; they manage tenants from /platform.
 */
export async function ensureRestaurantForUser(input: {
  userId: string;
  name: string;
  slug: string;
}): Promise<Restaurant | null> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_user_id", input.userId)
    .maybeSingle();
  if (existing) return existing as Restaurant;

  // Skip auto-create for platform admins.
  const platform = await getPlatformContext();
  if (platform) return null;

  // Generate a unique master takeout code on creation.
  const takeoutCode = `to-${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      owner_user_id: input.userId,
      name: input.name,
      slug: input.slug,
      takeout_code: takeoutCode,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create restaurant");
  return data as Restaurant;
}
