import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/sign-in");
  return <SettingsForm restaurant={ctx.restaurant} />;
}
