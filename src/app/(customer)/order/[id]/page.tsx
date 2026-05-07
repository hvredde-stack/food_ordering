import { redirect, notFound } from "next/navigation";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { OrderTracker } from "./order-tracker";
import { SentimentButtons } from "@/components/customer/sentiment-buttons";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getActiveSession();
  if (!session) redirect("/");

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .eq("session_id", session.id)
    .maybeSingle();
  if (!order) notFound();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("currency, name")
    .eq("id", session.restaurant_id)
    .single();

  return (
    <>
      <OrderTracker
        initialOrder={order as any}
        currency={(restaurant?.currency as string) ?? "USD"}
        restaurantName={(restaurant?.name as string) ?? ""}
      />
      <SentimentButtons />
    </>
  );
}
