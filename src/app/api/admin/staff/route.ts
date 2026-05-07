// GET  /api/admin/staff — list staff allowlist for the caller's restaurant.
// POST /api/admin/staff — add an email to the allowlist.
//
// Caller must be the owner OR an existing staff member (getAdminContext
// recognises both). Platform admins go through /api/platform endpoints
// for cross-tenant management; this endpoint is single-tenant by design.

import { z } from "zod";
import { json, parseJson, badRequest, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("restaurant_staff")
    .select("id, email, user_id, invited_by_user_id, created_at")
    .eq("restaurant_id", ctx.restaurant.id)
    .order("created_at", { ascending: true });
  if (error) return serverError(error.message);
  return json({ staff: data ?? [] });
}

const PostBody = z.object({
  email: z.string().email().max(254),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, PostBody);
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  // Refuse duplicates per restaurant.
  const { data: dupe } = await supabase
    .from("restaurant_staff")
    .select("id")
    .eq("restaurant_id", ctx.restaurant.id)
    .ilike("email", email)
    .maybeSingle();
  if (dupe) return badRequest(`${email} is already on the staff list.`);

  const { data, error } = await supabase
    .from("restaurant_staff")
    .insert({
      restaurant_id: ctx.restaurant.id,
      email,
      // user_id stays null until they sign in for the first time.
      invited_by_user_id: ctx.userId,
    })
    .select("*")
    .single();
  if (error) return serverError(error.message);

  return json({ staff: data }, { status: 201 });
}
