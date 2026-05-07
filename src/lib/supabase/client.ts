// Browser-side Supabase client (anon key). Used for read-only realtime
// subscriptions on the customer + kitchen UIs.
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient<any, any, any> | null = null;

export function getSupabaseBrowser(): SupabaseClient<any, any, any> {
  if (cached) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as SupabaseClient<any, any, any>;
  return cached;
}
