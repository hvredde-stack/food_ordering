// GET /api/admin/tables — list tables for the admin's restaurant.
// POST /api/admin/tables — create a new table.

import { z } from "zod";
import { json, parseJson, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const supabase = getSupabaseAdmin();

  // Fetch tables + every active customer session in this restaurant in
  // parallel. Active sessions tied to a table mean that table is occupied;
  // we surface the customer name + how long they've been seated so the
  // owner can read "Table 03 · Sarah · 45m" at a glance.
  const [{ data: tables, error: tErr }, { data: sessions, error: sErr }] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("*")
      .eq("restaurant_id", ctx.restaurant.id)
      .order("code"),
    supabase
      .from("customer_sessions")
      .select("id, table_id, customer_name, party_size, created_at, last_active_at, status, cleaned_at")
      .eq("restaurant_id", ctx.restaurant.id)
      .not("table_id", "is", null),
  ]);
  if (tErr) return serverError(tErr.message);
  if (sErr) return serverError(sErr.message);

  // For each table: the active session (if any) + the most recent
  // cleaned_at timestamp. "Available" = no active session.
  const tablesWithStatus = (tables ?? []).map((t) => {
    let active: typeof sessions extends Array<infer S> ? S : never = null as any;
    let lastCleanedAt: string | null = null;
    for (const s of sessions ?? []) {
      if (s.table_id !== t.id) continue;
      if (s.status === "active" && !active) {
        active = s as any;
      } else if (s.status === "cleaned" && s.cleaned_at) {
        if (!lastCleanedAt || (s.cleaned_at as string) > lastCleanedAt) {
          lastCleanedAt = s.cleaned_at as string;
        }
      }
    }
    return { ...t, occupancy: active, last_cleaned_at: lastCleanedAt };
  });

  return json({ tables: tablesWithStatus, restaurant: ctx.restaurant });
}

const PostBody = z.object({
  code: z.string().min(1).max(20),
  label: z.string().max(80).optional(),
  seats: z.number().int().positive().max(50).default(2),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, PostBody);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({ ...parsed.data, restaurant_id: ctx.restaurant.id })
    .select("*")
    .single();
  if (error) return serverError(error.message);
  return json({ table: data });
}
