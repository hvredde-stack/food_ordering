// GET /api/admin/restaurant — current admin's restaurant (creates one if missing).
// PATCH /api/admin/restaurant — update name/slug/etc.

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { json, parseJson, unauthorized, serverError } from "@/lib/api";
import { ensureRestaurantForUser, getAdminContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  // Bootstrap a restaurant for new admins on first GET.
  const restaurant = await ensureRestaurantForUser({
    userId,
    name: "My Restaurant",
    slug: `r-${slugify(userId).slice(0, 12)}-${Date.now().toString(36)}`,
  });
  return json({ restaurant });
}

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
});

export async function PATCH(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, PatchBody);
  if (!parsed.ok) return parsed.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("restaurants")
    .update(parsed.data)
    .eq("id", ctx.restaurant.id)
    .select("*")
    .single();
  if (error) return serverError(error.message);
  return json({ restaurant: data });
}
