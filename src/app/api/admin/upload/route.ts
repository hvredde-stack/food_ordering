// POST /api/admin/upload — return a signed Supabase Storage upload ticket.
// The browser uses supabase-js uploadToSignedUrl(path, token, file) to upload,
// then PATCHes the dish with the returned publicUrl.

import { z } from "zod";
import { json, parseJson, unauthorized, serverError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth";
import { createDishUploadTicket } from "@/lib/storage";

const Body = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().regex(/^image\/(png|jpe?g|webp|gif|avif)$/i),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return unauthorized();
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return parsed.response;

  try {
    const ticket = await createDishUploadTicket({
      restaurantId: ctx.restaurant.id,
      filename: parsed.data.filename,
    });
    return json(ticket);
  } catch (err) {
    return serverError((err as Error).message);
  }
}
