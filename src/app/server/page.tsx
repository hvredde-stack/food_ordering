import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOwnedRestaurant } from "@/lib/auth";

// /server resolves to the signed-in owner's /<slug>/server. Kept around as
// a courtesy for printed materials and saved bookmarks pre-dating the
// slug-first URL refactor.
export const dynamic = "force-dynamic";

export default async function ServerShim() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const restaurant = await getOwnedRestaurant(userId);
  if (!restaurant) redirect("/onboarding");

  redirect(`/${restaurant.slug}/server`);
}
