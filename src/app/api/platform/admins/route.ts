// GET  /api/platform/admins — list platform admins.
// POST /api/platform/admins — invite by email (Clerk user must exist).

import { z } from "zod";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { json, parseJson, unauthorized, badRequest, serverError } from "@/lib/api";
import { getPlatformContext } from "@/lib/platform";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const ctx = await getPlatformContext();
  if (!ctx) return unauthorized("Platform admin only");

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("platform_admins")
    .select("*")
    .order("created_at", { ascending: false });
  return json({ admins: data ?? [], me: { user_id: ctx.userId } });
}

const PostBody = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const ctx = await getPlatformContext();
  if (!ctx) return unauthorized("Platform admin only");

  const parsed = await parseJson(req, PostBody);
  if (!parsed.ok) return parsed.response;
  const email = parsed.data.email.toLowerCase();

  const cc = await clerkClient();
  const { data: users } = await cc.users.getUserList({ emailAddress: [email] });
  if (!users || users.length === 0) {
    return badRequest(
      `No Clerk user found with email ${email}. Ask them to sign up at /admin/sign-up first.`
    );
  }
  const u = users[0];

  const supabase = getSupabaseAdmin();
  const { data: dupe } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("user_id", u.id)
    .maybeSingle();
  if (dupe) return badRequest("That user is already a platform admin.");

  const { data, error } = await supabase
    .from("platform_admins")
    .insert({
      user_id: u.id,
      email,
      display_name: u.firstName || u.username || email,
      invited_by_user_id: ctx.userId,
    })
    .select("*")
    .single();
  if (error || !data) return serverError(error?.message ?? "Failed to invite admin");
  return NextResponse.json({ admin: data }, { status: 201 });
}
