import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Resolve Supabase env vars on the server.
 *
 * On Cloudflare/OpenNext, runtime vars & secrets bound to the Worker are
 * exposed via `getCloudflareContext().env` and are NOT always mirrored onto
 * `process.env`. We read the Cloudflare context first (when inside a request)
 * and fall back to `process.env` (build/dev, or when populated).
 *
 * SERVER ONLY — never import into client components.
 */
export function getServerSupabaseEnv(): {
  url?: string;
  anonKey?: string;
  serviceKey?: string;
} {
  let cf: Record<string, string | undefined> = {};
  try {
    cf = (getCloudflareContext().env ?? {}) as unknown as Record<
      string,
      string | undefined
    >;
  } catch {
    // Not inside a Cloudflare request context (e.g. during build) — fall back.
  }

  return {
    url: cf.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey:
      cf.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey:
      cf.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}
