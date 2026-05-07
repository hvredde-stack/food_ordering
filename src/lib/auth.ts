// Admin auth: load the Clerk-authenticated user's restaurant. Two access
// models live side-by-side now:
//
//  - User-bound (legacy): getAdminContext / getOwnedRestaurant — used by
//    the /admin shim that decides where a freshly-signed-in user lands.
//  - Slug-bound: getRestaurantBySlug / getRestaurantAccess — used by every
//    /<slug>/admin, /<slug>/kitchen, /<slug>/server page. Lets the URL
//    identify the restaurant, which means platform admins can also visit
//    those routes (impersonation-by-access) without tripping the redirect
//    that used to punt them back to /platform.

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
 * Look up the restaurant owned by a specific Clerk user. Returns null if
 * none exists. Read-only — the wizard at /onboarding is responsible for
 * creating restaurants now (auto-create on first /admin hit was confusing
 * because it gave new users a default-named tenant they had to rename).
 */
export async function getOwnedRestaurant(userId: string): Promise<Restaurant | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return (data as Restaurant) ?? null;
}

/** Public lookup by slug. Returns null on miss; never throws. */
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Restaurant) ?? null;
}

export interface RestaurantAccess {
  userId: string;
  restaurant: Restaurant;
  isOwner: boolean;
  isPlatformAdmin: boolean;
}

/**
 * Authorize the current Clerk user against a slug-identified restaurant.
 *
 *  - Returns null when there's no Clerk session, when the slug doesn't
 *    exist, or when the user is neither the owner nor a platform admin.
 *  - Owner check is direct (restaurants.owner_user_id == clerk userId).
 *  - Platform admin check piggybacks on the same getPlatformContext used
 *    by /platform, so a single source of truth governs both surfaces.
 */
export async function getRestaurantAccess(slug: string): Promise<RestaurantAccess | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return null;

  if (restaurant.owner_user_id === userId) {
    return { userId, restaurant, isOwner: true, isPlatformAdmin: false };
  }

  const platform = await getPlatformContext();
  if (platform) {
    return { userId, restaurant, isOwner: false, isPlatformAdmin: true };
  }

  return null;
}
