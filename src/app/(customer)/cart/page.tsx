import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CartView } from "./cart-view";
import { SentimentButtons } from "@/components/customer/sentiment-buttons";

export default async function CartPage() {
  const session = await getActiveSession();
  if (!session) redirect("/");

  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("currency, name")
    .eq("id", session.restaurant_id)
    .single();

  return (
    <>
      <CartView currency={(restaurant?.currency as string) ?? "USD"} />
      <SentimentButtons />
    </>
  );
}
