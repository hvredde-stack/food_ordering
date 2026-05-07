import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { KitchenBoard } from "./kitchen-board";

export default async function KitchenForRestaurant({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, currency, owner_user_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();

  // Tenant gate: only the linked owner can open this kitchen.
  if (restaurant.owner_user_id !== userId) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-muted mt-2">
          You're not authorized to view the kitchen for this restaurant.
        </p>
      </div>
    );
  }

  return (
    <KitchenBoard
      restaurantId={restaurant.id as string}
      restaurantSlug={restaurant.slug as string}
      restaurantName={restaurant.name as string}
      currency={(restaurant.currency as string) ?? "USD"}
    />
  );
}
