// DELETE /api/admin/staff/[id] — revoke a staff member.
//
// The Clerk account is NOT deleted; only the link to this restaurant.
// If they sign in again they'll land on /onboarding (no owned tenant,
// no remaining staff membership).

import { json, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();

  const supabase = getSupabaseAdmin();
  // Scope by restaurant_id so no one can revoke staff from a different
  // tenant by guessing UUIDs.
  const { error } = await supabase
    .from("restaurant_staff")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", ctx.restaurant.id);
  if (error) return serverError(error.message);
  return json({ ok: true });
}
