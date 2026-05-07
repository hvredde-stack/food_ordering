// Post-onboarding success screen. The full URL hub for the new restaurant
// + a 3-step "what to do next" guide. Friendlier copy than the platform
// admin's tearsheet — written for the restaurant owner.

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { getOwnedRestaurant } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { UrlHubFriendly } from "./url-hub-friendly";

export default async function WelcomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const restaurant = await getOwnedRestaurant(userId);
  if (!restaurant) redirect("/onboarding");

  const supabase = getSupabaseAdmin();
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, code, label, seats")
    .eq("restaurant_id", restaurant.id)
    .order("code");

  return (
    <div className="max-w-3xl mx-auto px-[clamp(20px,5vw,60px)] py-16 md:py-24">
      <div className="reveal reveal-1 font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
        You're set up
      </div>
      <h1
        className="reveal reveal-2 font-display font-light mt-6 leading-[0.95] tracking-[-0.02em]"
        style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
      >
        Welcome to <em className="italic font-light text-accent-2">{restaurant.name}</em>.
      </h1>
      <p className="reveal reveal-3 mt-8 text-[17px] leading-[1.7] text-muted max-w-md">
        Your restaurant is live. Print your QR codes, add a few menu items,
        and you're ready to take orders.
      </p>

      {/* 3-step getting started */}
      <Card className="reveal reveal-4 mt-12">
        <CardHeader>
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
            What to do next
          </div>
        </CardHeader>
        <div className="divide-y divide-border">
          <NextStep
            no="01"
            title="Add your menu"
            desc="Categories like Starters, Mains, Drinks. Then add dishes with prices and photos. Customers see updates instantly."
            href="/admin/menu"
            cta="Add menu items"
          />
          <NextStep
            no="02"
            title="Print your table QR codes"
            desc="Each table has a unique URL. We've already created QRs — just open the page, download as PNG, print one per table."
            href="/admin/tables"
            cta="Open table QRs"
          />
          <NextStep
            no="03"
            title="Set up takeout (optional)"
            desc="One master takeout QR. Place it at your counter or share it on social. Customers scan, order, you call them when it's ready."
            href="/admin/settings"
            cta="View takeout QR"
          />
        </div>
      </Card>

      {/* Full URL hub for sharing/printing */}
      <div className="reveal reveal-4 mt-12">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
          All your links
        </div>
        <h2 className="font-display text-3xl tracking-tight mt-3">
          Five URLs for your restaurant
        </h2>
        <p className="text-sm text-muted mt-2 max-w-md leading-relaxed">
          Three for your team to sign in, two for customers to scan.
        </p>
        <div className="mt-6">
          <UrlHubFriendly
            slug={restaurant.slug}
            takeoutCode={restaurant.takeout_code}
            tables={(tables ?? []) as { id: string; code: string; label: string | null; seats: number }[]}
          />
        </div>
      </div>

      <div className="mt-16 text-center">
        <Link href="/admin" className="text-link group inline-flex">
          <span>Go to your admin dashboard</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-[350ms] ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function NextStep({
  no, title, desc, href, cta,
}: {
  no: string; title: string; desc: string; href: string; cta: string;
}) {
  return (
    <div className="p-5 md:p-6">
      <div className="grid grid-cols-[40px,1fr] md:grid-cols-[40px,1fr,auto] gap-4 md:gap-6 items-baseline">
        <div className="font-mono text-xs text-muted tracking-[0.2em]">{no}</div>
        <div>
          <div className="font-display text-xl tracking-tight">{title}</div>
          <p className="text-sm text-muted mt-2 leading-[1.65] max-w-md">{desc}</p>
        </div>
        <Link
          href={href}
          className="text-link mt-4 md:mt-0 md:col-start-3 col-start-2 group inline-flex"
        >
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase">{cta}</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-[350ms] ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
