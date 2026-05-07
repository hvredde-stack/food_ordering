import { redirect } from "next/navigation";
import { getRestaurantAccess } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getRestaurantAccess(slug);
  if (!ctx) redirect("/admin/sign-in");
  return <SettingsForm restaurant={ctx.restaurant} />;
}
