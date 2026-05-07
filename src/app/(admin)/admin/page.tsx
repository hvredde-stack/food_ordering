import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOwnedRestaurant } from "@/lib/auth";
import { getPlatformContext } from "@/lib/platform";

// /admin is no longer a real page — it's a router that sends each user to
// the right place. Owners get /<their-slug>/admin; platform admins get
// /platform; brand-new users get /onboarding. This decouples the
// post-sign-in redirect from any specific tenant slug.
export const dynamic = "force-dynamic";

export default async function AdminShim() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const platform = await getPlatformContext();
  if (platform) redirect("/platform");

  const restaurant = await getOwnedRestaurant(userId);
  if (!restaurant) redirect("/onboarding");

  redirect(`/${restaurant.slug}/admin`);
}
