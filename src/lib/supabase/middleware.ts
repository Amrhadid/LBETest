import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * Refreshes the Supabase auth session on each request and rewrites the auth
 * cookies onto the outgoing response, so Server Components always see a fresh
 * session. Also gates protected routes (e.g. /dashboard).
 *
 * Edge-compatible: uses only Web-standard request/response cookie APIs.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, don't block the site — just pass through.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase. Do not run other
  // code between creating the client and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate protected routes. Redirect unauthenticated users to /login.
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/dashboard");

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
