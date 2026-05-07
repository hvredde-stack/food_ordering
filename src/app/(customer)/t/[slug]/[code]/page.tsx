// Customer scan landing: /t/<restaurant-slug>/<table-code>
// Server component that loads the restaurant + table, then shows a
// confirm form which posts to /api/sessions and redirects to /menu.

import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TableConfirm } from "./table-confirm";

interface Params { slug: string; code: string }

export default async function TablePage({ params }: { params: Promise<Params> }) {
  const { slug, code } = await params;
  const supabase = getSupabaseAdmin();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, description, logo_url, currency")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, code, label, seats")
    .eq("restaurant_id", restaurant.id)
    .ilike("code", code)
    .maybeSingle();
  if (!table) notFound();

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted">{restaurant.name}</div>
        <h1 className="mt-2 text-3xl font-bold">Welcome</h1>
        <p className="mt-1 text-muted">
          You're at table <span className="font-semibold text-fg">{table.code}</span>
          {table.label ? ` (${table.label})` : ""}.
        </p>
      </div>

      <TableConfirm restaurantSlug={restaurant.slug as string} tableCode={table.code as string} />
    </div>
  );
}
