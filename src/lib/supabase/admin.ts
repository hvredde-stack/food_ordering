// Service-role Supabase client. SERVER ONLY — bypasses RLS.
// Never import from a "use client" file.
//
// Typed as <any, any, any> so .from('table') is reachable without a
// generated Database schema. Run `supabase gen types typescript` and
// swap the generic in once schema lives in the cloud.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let cached: SupabaseClient<any, any, any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any, any, any> {
  if (cached) return cached;
  if (!env.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — required for server operations.");
  }
  cached = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "food-ordering-admin" } },
  });
  return cached;
}
