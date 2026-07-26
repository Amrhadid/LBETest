import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * Browser Supabase client for Client Components.
 *
 * Reads config from public env vars (already set in Cloudflare). Safe to call
 * on every render — `createBrowserClient` memoizes a single instance.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
