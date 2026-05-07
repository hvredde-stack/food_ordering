// Image storage backed by Supabase Storage (one bucket, namespaced by
// restaurant_id). Browser uploads via a signed-upload URL minted by the
// service-role client, then renders the resulting public URL.

import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "dish-images";

export function buildObjectPath(restaurantId: string, filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const random = randomBytes(8).toString("hex");
  return `${restaurantId}/${Date.now()}-${random}.${ext}`;
}

export async function createDishUploadTicket(input: {
  restaurantId: string;
  filename: string;
}) {
  const supabase = getSupabaseAdmin();
  const path = buildObjectPath(input.restaurantId, input.filename);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create signed upload URL");
  }
  const { data: pub } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return {
    bucket: STORAGE_BUCKET,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
  };
}

export async function deleteDishImage(path: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
