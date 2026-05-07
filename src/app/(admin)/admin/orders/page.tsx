import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { OrdersLive } from "./orders-live";

export default async function AdminOrdersPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/sign-in");
  return (
    <OrdersLive
      restaurantId={ctx.restaurant.id}
      restaurantSlug={ctx.restaurant.slug}
      currency={ctx.restaurant.currency}
    />
  );
}
