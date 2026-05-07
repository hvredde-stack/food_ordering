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
      <div className="min-h-screen flex items-center">
        <div className="max-w-md mx-auto px-6 py-16 text-center w-full">
          <h1 className="font-display text-4xl tracking-tight">Takeout unavailable</h1>
          <p className="text-muted mt-3">{restaurant.name as string} isn't accepting takeout orders right now.</p>
        </div>
      </div>
    );
  }
  if (restaurant.takeout_code !== code) notFound();

  return (
    <div className="min-h-screen flex items-center">
      <div className="max-w-md mx-auto px-6 py-12 w-full">
        <div className="text-center">
          <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
            Takeout from
          </div>
          <h1
            className="font-display font-light mt-5 leading-[0.95] tracking-tight text-balance break-words"
            style={{ fontSize: "clamp(32px, 6.5vw, 64px)" }}
          >
            {restaurant.name as string}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Enter your name to start ordering for pickup.
          </p>
        </div>
        <TakeoutConfirm restaurantSlug={restaurant.slug as string} takeoutCode={code} />
      </div>
    </div>
  );
}
