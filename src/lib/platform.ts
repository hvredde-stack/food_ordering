// Platform admin tier — your company / SaaS staff.
//
// Bootstrap rule: any Clerk user whose primary email is in
// `PLATFORM_ADMIN_EMAILS` is auto-granted platform admin on first hit.
// We persist the grant in `platform_admins` so the env var can later be
// removed without revoking access (and so audits / display work).

import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { PlatformAdmin } from "@/lib/types";

interface PlatformContext {
  userId: string;
  email: string | null;
  admin: PlatformAdmin;
}

export async function getPlatformContext(): Promise<PlatformContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabaseAdmin();

  // Fast path: existing row.
  const { data: existing } = await supabase
    .from("platform_admins")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    return {
      userId,
      email: (existing.email as string | null) ?? null,
      admin: existing as PlatformAdmin,
    };
  }

  // Bootstrap path: Clerk user whose email is in the env allow-list.
  if (env.platformAdminEmails.length === 0) return null;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
    ?? user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    ?? null;
  if (!email || !env.platformAdminEmails.includes(email)) return null;

  const displayName =
    user?.firstName ||
    user?.username ||
    email;

  const { data: created, error } = await supabase
    .from("platform_admins")
    .insert({
      user_id: userId,
      email,
      display_name: displayName,
      invited_by_user_id: null, // env-bootstrapped
    })
    .select("*")
    .single();
  if (error || !created) return null;

  return {
    userId,
    email,
    admin: created as PlatformAdmin,
  };
}

export async function requirePlatformAdmin() {
  const ctx = await getPlatformContext();
  if (!ctx) {
    throw new Error("Platform admin access required");
  }
  return ctx;
}
