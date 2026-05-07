import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getRestaurantAccess } from "@/lib/auth";
import { ServerApp } from "./server-app";

export default async function ServerHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await getRestaurantAccess(slug);
  if (!access) redirect("/admin/sign-in");
  const { restaurant } = access;

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
