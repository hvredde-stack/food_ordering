import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOwnedRestaurant } from "@/lib/auth";
import { getPlatformContext } from "@/lib/platform";

export default async function KitchenIndex() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const platform = await getPlatformContext();
  if (platform) redirect("/platform");

  const restaurant = await getOwnedRestaurant(userId);
  if (!restaurant) redirect("/onboarding");
  redirect(`/kitchen/${restaurant.slug}`);
}
