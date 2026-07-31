import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { profileNeedsOnboarding } from "@/lib/auth/onboarding";

/**
 * Auth callback for Google OAuth / magic-link flows. Supabase redirects here
 * with a `code` that we exchange for a session (PKCE). On success we send the
 * user on to `next` (defaults to /dashboard) — but a first-time candidate who
 * hasn't onboarded is routed through /onboarding first (carrying `next`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarded_at")
          .eq("id", user.id)
          .maybeSingle();
        if (profileNeedsOnboarding(profile)) {
          return NextResponse.redirect(
            `${origin}/onboarding?next=${encodeURIComponent(next)}`,
          );
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fall back to the login page with an error flag if the exchange failed.
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
