import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOwnedRestaurant } from "@/lib/auth";
import { getPlatformContext } from "@/lib/platform";
import { ServerApp } from "./server-app";

export default async function ServerHome() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const platform = await getPlatformContext();
  if (platform) redirect("/platform");

  const restaurant = await getOwnedRestaurant(userId);
  if (!restaurant) redirect("/onboarding");

  const user = await currentUser();
  const displayName =
    user?.firstName ||
    user?.username ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "staff";

  return (
    <ServerApp
      restaurantSlug={restaurant.slug}
      restaurantName={restaurant.name}
      staffDisplayName={displayName}
    />
  );
}
