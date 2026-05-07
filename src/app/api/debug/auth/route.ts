// TEMPORARY DEBUG ENDPOINT — delete after diagnosing the production 500.

import { NextResponse } from "next/server";

export async function GET() {
  const out: Record<string, unknown> = {
    env_pub_clerk_present: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    env_pub_clerk_len: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length ?? 0,
    env_clerk_secret_present: !!process.env.CLERK_SECRET_KEY,
    env_clerk_secret_len: process.env.CLERK_SECRET_KEY?.length ?? 0,
    env_supabase_url_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    env_service_role_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    runtime: process.env.NEXT_RUNTIME ?? "unknown",
    node_version: process.version ?? "?",
  };
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const a = await auth();
    out.auth_ok = true;
    out.auth_userId = a.userId ?? null;
    out.auth_sessionId = a.sessionId ?? null;
  } catch (e) {
    out.auth_ok = false;
    out.auth_error_name = (e as Error).name;
    out.auth_error_message = (e as Error).message;
    out.auth_error_stack = ((e as Error).stack ?? "").split("\n").slice(0, 8).join("\n");
  }
  return NextResponse.json(out);
}
