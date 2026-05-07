// Post-signin router. Decides where the freshly-authenticated user lands:
//   1. Platform admin               → /platform
//   2. Restaurant owner             → /<slug>/admin
//   3. Restaurant staff (allowlist) → /<slug>/admin (their employer's)
//   4. Brand new user (no link)     → /onboarding (self-serve wizard)
//
// For staff, this is also where we perform the one-time linking of the
// Clerk user_id to their restaurant_staff row. The owner pre-authorised
// an email; when that person signs up via Clerk and lands here, we
// match the email and capture the user_id so subsequent /api/admin/*
// lookups skip the email scan.

import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPlatformContext } from "@/lib/platform";
import { getOwnedRestaurant } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AfterSignIn() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const platform = await getPlatformContext();
  if (platform) redirect("/platform");

  const restaurant = await getOwnedRestaurant(userId);
  if (restaurant) redirect(`/${restaurant.slug}/admin`);

  // No owned restaurant — could be staff. Look for an existing staff
  // membership (already linked) or a pending invite (matching email).
  const supabase = getSupabaseAdmin();

  const { data: existingStaff } = await supabase
    .from("restaurant_staff")
    .select("restaurant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingStaff) {
    const { data: r } = await supabase
      .from("restaurants")
      .select("slug")
      .eq("id", existingStaff.restaurant_id)
      .maybeSingle();
    if (r?.slug) redirect(`/${r.slug}/admin`);
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ??
    user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ??
    null;
  if (email) {
    const { data: pendingInvite } = await supabase
      .from("restaurant_staff")
      .select("id, restaurant_id")
      .ilike("email", email)
      .is("user_id", null)
      .maybeSingle();
    if (pendingInvite) {
      // Capture the user_id so future requests are O(1) on user_id
      // instead of an email lookup.
      await supabase
        .from("restaurant_staff")
        .update({ user_id: userId })
        .eq("id", pendingInvite.id);
      const { data: r } = await supabase
        .from("restaurants")
        .select("slug")
        .eq("id", pendingInvite.restaurant_id)
        .maybeSingle();
      if (r?.slug) redirect(`/${r.slug}/admin`);
    }
  }

  // No owner restaurant, no staff link, no pending invite — this is a
  // brand-new user who came here to start a restaurant. Off to the wizard.
  redirect("/onboarding");
}
