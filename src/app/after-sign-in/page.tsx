// Post-signin router. Decides where the freshly-authenticated user lands:
//   1. Platform admin → /platform
//   2. Restaurant owner → /admin
//   3. Brand new user (no restaurant yet) → /onboarding (self-serve wizard)
//
// Doing this in one tiny server component keeps /admin out of browser
// history for platform admins and prevents unnecessary auto-creates.

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPlatformContext } from "@/lib/platform";
import { getOwnedRestaurant } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AfterSignIn() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const platform = await getPlatformContext();
  if (platform) redirect("/platform");

  const restaurant = await getOwnedRestaurant(userId);
  if (restaurant) redirect(`/${restaurant.slug}/admin`);

  redirect("/onboarding");
}
