import { redirect } from "next/navigation";
import { getRestaurantAccess } from "@/lib/auth";
import { AnalyticsView } from "./analytics-view";

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getRestaurantAccess(slug);
  if (!ctx) redirect("/admin/sign-in");
  return <AnalyticsView currency={ctx.restaurant.currency} />;
}
