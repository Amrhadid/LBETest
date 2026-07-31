"use client";

import * as React from "react";
import { ArrowRight, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { createClient, type PublicSupabaseConfig } from "@/lib/supabase/client";

/**
 * Home-page "start here" card.
 *
 * The homepage is statically cached, so auth state can't be known on the
 * server. We resolve the session in the browser and show:
 *  - signed OUT → "Continue with Google" (sign-in and sign-up are the same;
 *    first-time candidates are routed through /onboarding by the auth callback).
 *  - signed IN  → a "Go to My Profile" shortcut instead — the Google button is
 *    never shown to a signed-in user.
 *
 * While the session resolves we render a small placeholder so a signed-in user
 * never sees the Google button flash.
 *
 * `config` carries the public Supabase URL + anon key from the server so the
 * browser client works even when NEXT_PUBLIC_* wasn't inlined at build time.
 */
export function RegistrationCard({
  config,
}: {
  config?: PublicSupabaseConfig;
}) {
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient(config);
    } catch {
      setSignedIn(false);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSignedIn(!!data.session);
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });
    // Reflect sign-in/out that happens in another tab.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [config]);

  return (
    <div className="corner-frame paper-panel relative border border-gold/30 bg-card p-6 sm:p-8">
      <div aria-hidden className="absolute inset-2 border border-gold/10" />
      <div className="relative">
        <p className="eyebrow">Start here</p>

        {signedIn === null ? (
          <div className="flex min-h-[188px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-gold" aria-hidden />
            <span className="sr-only">Loading…</span>
          </div>
        ) : signedIn ? (
          <>
            <h2 className="font-serif-display mt-2 text-2xl text-charcoal">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You&rsquo;re signed in. Head to your profile to view your results,
              certificates, and pick up where you left off.
            </p>
            <div className="mt-6">
              <Button asChild variant="gold" className="w-full">
                <a href="/dashboard">
                  Go to My Profile
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif-display mt-2 text-2xl text-charcoal">
              Sign in to begin
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your Google account to sign in or create your account —
              it&rsquo;s the fastest, most secure way in. New here? Continuing
              with Google sets up your account automatically.
            </p>
            <div className="mt-6">
              <GoogleButton label="Continue with Google" config={config} />
            </div>
          </>
        )}

        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Takes less than a minute.</span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-gold" />
            Secure registration
          </span>
        </div>
      </div>
    </div>
  );
}
