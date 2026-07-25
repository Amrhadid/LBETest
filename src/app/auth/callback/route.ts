import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback for magic-link and email-confirmation flows. Supabase redirects
 * here with a `code` that we exchange for a session (PKCE). On success we send
 * the user on to `next` (defaults to /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fall back to the login page with an error flag if the exchange failed.
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
