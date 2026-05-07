import { redirect } from "next/navigation";
import { getRestaurantAccess } from "@/lib/auth";
import { KitchenBoard } from "./kitchen-board";

export default async function KitchenForRestaurant({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Owner gets access. Platform admins also get access (so they can spot-
  // check a restaurant's kitchen without an impersonation flow). Anyone
  // else hits /admin/sign-in and is bounced back through the shim.
  const access = await getRestaurantAccess(slug);
  if (!access) redirect("/admin/sign-in");
  const { restaurant } = access;

  return (
    <KitchenBoard
      restaurantId={restaurant.id}
      restaurantSlug={restaurant.slug}
      restaurantName={restaurant.name}
      currency={restaurant.currency ?? "USD"}
    />
  );
}
