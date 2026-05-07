// Customer scan landing: /t/<restaurant-slug>/<table-code>
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
    <div className="min-h-screen flex items-center">
      <div className="max-w-md mx-auto px-6 py-12 w-full">
        <div className="text-center">
          <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
            Welcome to
          </div>
          <h1
            className="font-display font-light mt-5 leading-[0.95] tracking-tight text-balance break-words"
            style={{ fontSize: "clamp(32px, 6.5vw, 64px)" }}
          >
            {restaurant.name as string}
          </h1>
          <div className="mt-8 font-mono text-xs tracking-[0.18em] uppercase text-muted">
            <span className="opacity-60">Table</span>{" "}
            <span className="text-fg">{table.code as string}</span>
            {table.label ? <span className="opacity-60"> — {table.label as string}</span> : null}
          </div>
        </div>

        <TableConfirm restaurantSlug={restaurant.slug as string} tableCode={table.code as string} />
      </div>
    </div>
  );
}
