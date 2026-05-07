import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlatformContext } from "@/lib/platform";
import { AdminsList } from "./admins-list";
import type { PlatformAdmin } from "@/lib/types";

export default async function PlatformAdminsPage() {
  const ctx = await getPlatformContext();
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("platform_admins")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminsList
      initialAdmins={(data ?? []) as PlatformAdmin[]}
      meUserId={ctx?.userId ?? ""}
    />
  );
}
