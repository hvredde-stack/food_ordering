// DELETE /api/admin/categories/[id]

import { json, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", ctx.restaurant.id);
  if (error) return serverError(error.message);
  return json({ ok: true });
}
