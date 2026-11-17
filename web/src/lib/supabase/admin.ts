import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the service-role key.
 * ⚠️  Server-only. Never import from client code.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must only run on the server");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env",
    );
  }

  return createSupabaseClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}