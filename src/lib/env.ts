// Centralized env access. Throws clearly if required vars are missing.

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  // Server-only.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "dish-images",
  sessionTtlSeconds: Number(process.env.CUSTOMER_SESSION_TTL_SECONDS ?? 1800),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
