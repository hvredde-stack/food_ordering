"use client";

// Clerk-aware Supabase client.
//
// In 2026 the recommended pattern is the native Clerk ↔ Supabase
// Third-Party Auth integration: Supabase verifies Clerk's session token
// via Clerk's JWKS, RLS reads claims from `auth.jwt()`, and we never
// have to know or share the JWT secret.
//
// supabase-js v2 supports an `accessToken` callback that runs before
// each request (REST and Realtime), so we hand it `session.getToken()`
// from the Clerk hook and the rest is automatic.

import { useMemo } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function useClerkSupabaseClient(): SupabaseClient<any, any, any> {
  const { session } = useSession();
  // Re-create on session swap (sign-out / sign-in across tabs).
  const sessionKey = session?.id ?? null;

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        async accessToken() {
          // Returns null when the user is signed out — Supabase falls
          // back to the publishable/anon role for that request.
          return (await session?.getToken()) ?? null;
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);
}
