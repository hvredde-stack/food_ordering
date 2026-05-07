// POST /api/sentiment — record a happy/sad click during the visit.

import { z } from "zod";
import { json, parseJson, unauthorized, serverError } from "@/lib/api";
import { getActiveSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({ kind: z.enum(["happy", "sad"]) });

export async function POST(req: Request) {
  const session = await getActiveSession();
  if (!session) return unauthorized("No active session");

  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sentiment_events")
    .insert({
      restaurant_id: session.restaurant_id,
      session_id: session.id,
      table_id: session.table_id,
      kind: parsed.data.kind,
    })
    .select("*")
    .single();
  if (error) return serverError(error.message);
  return json({ event: data });
}
