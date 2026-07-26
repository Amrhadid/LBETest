import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

/**
 * Server Supabase client for Server Components, Route Handlers and Server
 * Actions. Wires the App Router cookie store into @supabase/ssr so the auth
 * session is read (and refreshed, where writable) per request.
 *
 * Edge/Cloudflare-compatible: uses only the Web-standard cookie APIs exposed
 * by `next/headers`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const { url, anonKey } = getServerSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component where cookies are
          // read-only. The middleware refreshes the session, so this is safe
          // to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client for trusted server-side operations that must bypass RLS
 * (e.g. issuing certificates, admin tooling). SERVER ONLY — never import this
 * into client code. Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export function createServiceRoleClient() {
  const { url, serviceKey } = getServerSupabaseEnv();

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  return createServerClient<Database>(url, serviceKey, {
    // No session persistence for the service-role client; it never uses cookies.
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
