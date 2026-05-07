// /to/<slug> — landing for the takeout URL without a code. Same gentle
// "scan the right QR" message as /t/<slug>, with a dine-in fallback
// when applicable.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function TakeoutLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, dine_in_enabled, takeout_enabled, status")
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

  return (
    <Centered>
      <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
        Takeout from
      </div>
      <h1
        className="font-display font-light mt-5 leading-[0.95] tracking-tight text-balance break-words"
        style={{ fontSize: "clamp(36px, 7vw, 72px)" }}
      >
        {restaurant.name as string}
      </h1>

      {restaurant.takeout_enabled ? (
        <div className="mt-12">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
            To order for pickup
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-fg">
            <ScanLine className="w-5 h-5" />
            <p className="text-[17px] leading-[1.7]">
              Scan the takeout QR code at our counter.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-muted mt-8 leading-relaxed">
          {restaurant.name as string} isn't accepting takeout orders right now.
        </p>
      )}

      {restaurant.dine_in_enabled && (
        <div className="mt-12 pt-12 border-t border-border max-w-sm mx-auto">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
            Dining in?
          </div>
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Scan the QR code on your table.
          </p>
        </div>
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
