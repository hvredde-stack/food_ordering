import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureRestaurantForUser } from "@/lib/auth";
import { ServerApp } from "./server-app";

export default async function ServerHome() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const restaurant = await ensureRestaurantForUser({
    userId,
    name: "My Restaurant",
    slug: `r-${userId.slice(-6).toLowerCase()}-${Date.now().toString(36).slice(-4)}`,
  });
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
