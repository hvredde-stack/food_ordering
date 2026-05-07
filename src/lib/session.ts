// Customer session helpers — issue, validate, touch, expire, clean.
// Sessions live in customer_sessions and are referenced by an HTTP-only
// cookie holding the random token.

import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { CustomerSession } from "@/lib/types";

export const SESSION_COOKIE = "fo_session";

export function newSessionToken(): string {
  return randomBytes(24).toString("base64url");
}

export function ttlExpiresAt(): string {
  return new Date(Date.now() + env.sessionTtlSeconds * 1000).toISOString();
}

interface CreateSessionInput {
  restaurantId: string;
  tableId: string;
  partySize?: number;
  customerName?: string;
}

export async function createSession(input: CreateSessionInput): Promise<CustomerSession> {
  const supabase = getSupabaseAdmin();
  const token = newSessionToken();
  const { data, error } = await supabase
    .from("customer_sessions")
    .insert({
      restaurant_id: input.restaurantId,
      table_id: input.tableId,
      token,
      status: "active",
      party_size: input.partySize ?? null,
      customer_name: input.customerName ?? null,
      expires_at: ttlExpiresAt(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create session");

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: env.sessionTtlSeconds,
  });
  return data as CustomerSession;
}

/**
 * Reads the session cookie, fetches the row, enforces TTL.
 * Returns null if missing, expired, or cleaned. Side-effect: bumps last_active_at.
 */
export async function getActiveSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("customer_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const session = data as CustomerSession;

  if (session.status !== "active") return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await supabase.from("customer_sessions").update({ status: "expired" }).eq("id", session.id);
    return null;
  }

  // Sliding expiration — bump on every authenticated touch.
  const newExpiry = ttlExpiresAt();
  await supabase
    .from("customer_sessions")
    .update({ last_active_at: new Date().toISOString(), expires_at: newExpiry })
    .eq("id", session.id);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: env.sessionTtlSeconds,
  });
  return { ...session, expires_at: newExpiry };
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Mark every active session for a table as cleaned. Used by the
 * server-app when staff scans a cleaned table.
 */
export async function cleanTableSessions(args: {
  restaurantId: string;
  tableId: string;
  staffUserId: string;
}): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("customer_sessions")
    .update({
      status: "cleaned",
      cleaned_at: new Date().toISOString(),
      cleaned_by_user_id: args.staffUserId,
    })
    .eq("restaurant_id", args.restaurantId)
    .eq("table_id", args.tableId)
    .eq("status", "active")
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
