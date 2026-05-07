// Admin auth: load the Clerk-authenticated user's restaurant. Three
// access models live side-by-side now:
//
//  - User-bound (legacy): getAdminContext / getOwnedRestaurant — used by
//    the /admin shim that decides where a freshly-signed-in user lands.
//    Now ALSO recognises staff (restaurant_staff allowlist) so a staff
//    member's first hit on /admin redirects to /<slug>/admin too.
//  - Slug-bound: getRestaurantBySlug / getRestaurantAccess — used by every
//    /<slug>/admin, /<slug>/kitchen, /<slug>/server page. Lets the URL
//    identify the restaurant, which means platform admins (and now
//    staff) can also visit those routes without tripping the redirect.
//  - Staff allowlist: restaurant_staff(email, user_id, ...). Owner adds
//    an email; staff signs up via Clerk; user_id is captured on first
//    sign-in by /after-sign-in. Subsequent lookups are O(1) on user_id.

import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlatformContext } from "@/lib/platform";
import type { Restaurant } from "@/lib/types";

/** Internal: find a restaurant by a staff member's user_id. */
async function getStaffRestaurant(userId: string): Promise<Restaurant | null> {
  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("restaurant_staff")
    .select("restaurant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) return null;
  const { data: r } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", row.restaurant_id)
    .maybeSingle();
  return (r as Restaurant) ?? null;
}

export async function getAdminContext(): Promise<{
  userId: string;
  restaurant: Restaurant;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabaseAdmin();

  // First: do they own a restaurant?
  const { data: owned } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (owned) return { userId, restaurant: owned as Restaurant };

  // Second: are they staff at one? (Allowlist captured by user_id.)
  const staffRestaurant = await getStaffRestaurant(userId);
  if (staffRestaurant) return { userId, restaurant: staffRestaurant };

  return null;
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
  isStaff: boolean;
}

/**
 * Authorize the current Clerk user against a slug-identified restaurant.
 *
 *  - Returns null when there's no Clerk session, when the slug doesn't
 *    exist, or when the user is none of: owner, staff, platform admin.
 *  - Owner check is direct (restaurants.owner_user_id == clerk userId).
 *  - Staff check looks up restaurant_staff by user_id (captured on first
 *    sign-in) — falls back to email match for the very first request.
 *  - Platform admin check piggybacks on the same getPlatformContext used
 *    by /platform, so a single source of truth governs both surfaces.
 */
export async function getRestaurantAccess(slug: string): Promise<RestaurantAccess | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return null;

  if (restaurant.owner_user_id === userId) {
    return { userId, restaurant, isOwner: true, isPlatformAdmin: false, isStaff: false };
  }

  const supabase = getSupabaseAdmin();

  // Fast path — staff membership already linked via user_id.
  const { data: staffByUserId } = await supabase
    .from("restaurant_staff")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (staffByUserId) {
    return { userId, restaurant, isOwner: false, isPlatformAdmin: false, isStaff: true };
  }

  // Slow path — first sign-in. Match on email, capture user_id so the
  // next request takes the fast path. Email is the link between the
  // owner's invite (which knows email) and Clerk's user (which knows
  // user_id but not which restaurant pre-authorised them).
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
    ?? user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (email) {
    const { data: staffByEmail } = await supabase
      .from("restaurant_staff")
      .select("id, user_id")
      .eq("restaurant_id", restaurant.id)
      .ilike("email", email)
      .maybeSingle();
    if (staffByEmail) {
      if (!staffByEmail.user_id) {
        await supabase
          .from("restaurant_staff")
          .update({ user_id: userId })
          .eq("id", staffByEmail.id);
      }
      return { userId, restaurant, isOwner: false, isPlatformAdmin: false, isStaff: true };
    }
  }

  // Last resort — platform admin (cross-tenant viewer).
  const platform = await getPlatformContext();
  if (platform) {
    return { userId, restaurant, isOwner: false, isPlatformAdmin: true, isStaff: false };
  }

  return null;
}
