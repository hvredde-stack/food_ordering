// Takeout scan landing: /to/<restaurant-slug>/<takeout-code>
// The takeout-code is the master code on the restaurant (one per restaurant).

import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TakeoutConfirm } from "./takeout-confirm";

interface Params { slug: string; code: string }

export default async function TakeoutPage({ params }: { params: Promise<Params> }) {
  const { slug, code } = await params;
  const supabase = getSupabaseAdmin();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, takeout_enabled, takeout_code")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();
  if (!restaurant.takeout_enabled) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">Takeout unavailable</h1>
        <p className="text-muted mt-2">{restaurant.name} isn't accepting takeout orders right now.</p>
      </div>
    );
  }
  if (restaurant.takeout_code !== code) notFound();

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted">{restaurant.name}</div>
        <h1 className="mt-2 text-3xl font-bold">Takeout</h1>
        <p className="mt-1 text-muted">Enter your name to start ordering.</p>
      </div>
      <TakeoutConfirm restaurantSlug={restaurant.slug as string} takeoutCode={code} />
    </div>
  );
}
