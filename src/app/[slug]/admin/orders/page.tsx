import { redirect } from "next/navigation";
import { getRestaurantAccess } from "@/lib/auth";
import { OrdersLive } from "./orders-live";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getRestaurantAccess(slug);
  if (!ctx) redirect("/admin/sign-in");
  return (
    <OrdersLive
      restaurantId={ctx.restaurant.id}
      restaurantSlug={ctx.restaurant.slug}
      currency={ctx.restaurant.currency}
    />
  );
}
