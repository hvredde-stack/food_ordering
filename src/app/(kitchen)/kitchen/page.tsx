import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ensureRestaurantForUser } from "@/lib/auth";

export default async function KitchenIndex() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const restaurant = await ensureRestaurantForUser({
    userId,
    name: "My Restaurant",
    slug: `r-${userId.slice(-6).toLowerCase()}-${Date.now().toString(36).slice(-4)}`,
  });
  redirect(`/kitchen/${restaurant.slug}`);
}
