// /t/<slug> — landing reached when someone hits the per-restaurant URL
// without a table code. Real customers always have a code embedded in
// the QR they scanned, so this view is mostly for people who arrive via
// a shared link, hand-typed URL, or the "Customer dine-in landing"
// quick-link in the platform tearsheet.
//
// Editorial: gentle, clear instructions; offer takeout as the fallback
// if the restaurant has it enabled.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function RestaurantLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, dine_in_enabled, takeout_enabled, takeout_code, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();

  if (restaurant.status === "suspended") {
    return (
      <Centered>
        <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
          Currently unavailable
        </div>
        <h1 className="font-display text-5xl mt-6 leading-tight tracking-tight">
          {restaurant.name as string}
        </h1>
        <p className="text-muted mt-6 leading-relaxed">
          We're not taking orders right now. Please check back later.
        </p>
      </Centered>
    );
  }

  const takeoutUrl =
    restaurant.takeout_enabled && restaurant.takeout_code
      ? `/${restaurant.slug}/to/${restaurant.takeout_code}`
      : null;

  return (
    <Centered>
      <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
        Welcome to
      </div>
      {/* Restaurant name is the headline — what the diner is here to see.
          The clamp scales down for long names so a 24-character restaurant
          still renders intelligibly on a 360px phone. text-balance keeps
          line breaks elegant when the name wraps. */}
      <h1
        className="font-display font-light mt-5 leading-[0.95] tracking-tight text-balance break-words"
        style={{ fontSize: "clamp(36px, 7vw, 72px)" }}
      >
        {restaurant.name as string}
      </h1>

      {restaurant.dine_in_enabled && (
        <div className="mt-12">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
            To order at your table
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-fg">
            <ScanLine className="w-5 h-5" />
            <p className="text-[17px] leading-[1.7]">
              Scan the QR code on your table to start.
            </p>
          </div>
        </div>
      )}

      {takeoutUrl && (
        <div className="mt-12 pt-12 border-t border-border max-w-sm mx-auto">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
            Or order for pickup
          </div>
          <div className="mt-6">
            <Link href={takeoutUrl} className="text-link inline-flex group">
              <span>Order takeout from {restaurant.name as string}</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-[350ms] ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}

      {!restaurant.dine_in_enabled && !takeoutUrl && (
        <p className="text-muted mt-8 leading-relaxed">
          {restaurant.name as string} isn't accepting online orders right now.
        </p>
      )}
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center">
      <div className="max-w-md mx-auto px-6 py-12 w-full text-center">
        {children}
      </div>
    </div>
  );
}
