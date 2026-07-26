import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/** Public Supabase config passed from the server (runtime) to the browser. */
export type PublicSupabaseConfig = { url: string; anonKey: string };

/**
 * Browser Supabase client for Client Components.
 *
 * On Cloudflare/OpenNext, `NEXT_PUBLIC_*` vars are only present in the browser
 * bundle if they existed at BUILD time. To avoid depending on that, callers
 * pass the public config (read from the Worker's runtime env on the server) via
 * `config`. We fall back to `process.env` for local/dev where build-time
 * inlining works.
 *
 * The anon key is safe to expose to the browser (it's protected by RLS).
 */
export function createClient(config?: Partial<PublicSupabaseConfig>) {
  const url = config?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase config: url and anon key are required (pass them from the server or set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY at build time).",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
