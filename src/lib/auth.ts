// Admin auth: load the Clerk-authenticated user's restaurant.
// Owners are linked via restaurants.owner_user_id == clerk_user_id.

import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
