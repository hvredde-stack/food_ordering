import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { AnalyticsView } from "./analytics-view";

export default async function AdminAnalyticsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/sign-in");
  return <AnalyticsView currency={ctx.restaurant.currency} />;
}
