import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using service_role key.
 * Bypasses RLS — use ONLY in server-side API routes / Edge Functions.
 * NEVER import this in client components or expose the key.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
