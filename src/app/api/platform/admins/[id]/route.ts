// DELETE /api/platform/admins/[id] — revoke a platform admin.
// Refuses to delete the last admin (lockout protection) or yourself.

import { json, unauthorized, badRequest, notFound, serverError } from "@/lib/api";
import { getPlatformContext } from "@/lib/platform";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getPlatformContext();
  if (!ctx) return unauthorized("Platform admin only");

  const supabase = getSupabaseAdmin();
  const { data: target } = await supabase
    .from("platform_admins")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!target) return notFound();
  if (target.user_id === ctx.userId) {
    return badRequest("You can't remove yourself. Have another platform admin do it.");
  }

  const { count } = await supabase
    .from("platform_admins")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) <= 1) {
    return badRequest("Refusing to remove the last platform admin.");
  }

  const { error } = await supabase.from("platform_admins").delete().eq("id", id);
  if (error) return serverError(error.message);
  return json({ ok: true });
}
