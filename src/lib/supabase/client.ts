// Anonymous browser-side Supabase client. Used only for storage uploads
// (uploadToSignedUrl) — Clerk-aware queries go through useClerkSupabaseClient.
"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient<any, any, any> | null = null;

export function getSupabaseBrowser(): SupabaseClient<any, any, any> {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ) as SupabaseClient<any, any, any>;
  return cached;
}
