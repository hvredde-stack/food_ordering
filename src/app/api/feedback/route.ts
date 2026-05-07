// POST /api/feedback — end-of-visit form. One per session (DB enforces).

import { z } from "zod";
import { json, parseJson, unauthorized, serverError, badRequest } from "@/lib/api";
import { getActiveSession, clearSessionCookie } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getActiveSession();
  if (!session) return unauthorized("No active session");

  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { error: fErr } = await supabase.from("feedback").insert({
    restaurant_id: session.restaurant_id,
    session_id: session.id,
    table_id: session.table_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });
  if (fErr) {
    if (fErr.code === "23505") return badRequest("Feedback already submitted for this session");
    return serverError(fErr.message);
  }

  // Mark the session as expired post-feedback so the cookie no longer
  // grants access. Server-app cleaning is independent and overrides.
  await supabase.from("customer_sessions").update({ status: "expired" }).eq("id", session.id);
  await clearSessionCookie();

  return json({ ok: true });
}
