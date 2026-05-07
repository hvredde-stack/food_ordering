// /session — the shared "everyone at this table / in this takeout group" view.
// Polls /api/sessions/shared every 4s for live updates.

import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SessionView } from "./session-view";
import { SentimentButtons } from "@/components/customer/sentiment-buttons";

export default async function SessionPage() {
  const session = await getActiveSession();
  if (!session) redirect("/");

  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("currency, name")
    .eq("id", session.restaurant_id)
    .single();

  let scopeLabel = "";
  if (session.order_type === "dine-in" && session.table_id) {
    const { data: table } = await supabase
      .from("restaurant_tables")
      .select("code, label")
      .eq("id", session.table_id)
      .single();
    scopeLabel = `Table ${table?.code ?? ""}`;
  } else {
    scopeLabel = "Takeout";
  }

  return (
    <>
      <SessionView
        currency={(restaurant?.currency as string) ?? "USD"}
        restaurantName={(restaurant?.name as string) ?? ""}
        scopeLabel={scopeLabel}
        meSessionId={session.id}
        meCustomerName={session.customer_name}
        orderType={session.order_type}
      />
      <SentimentButtons />
    </>
  );
}
