import { Lock } from "lucide-react";

import { GoogleButton } from "@/components/auth/GoogleButton";
import type { PublicSupabaseConfig } from "@/lib/supabase/client";

/**
 * Home-page "start here" card. Sign-in and sign-up are one and the same: Google
 * creates the account on first login and signs in on return. First-time
 * candidates are then routed through /onboarding (handled in the auth callback).
 *
 * `config` carries the public Supabase URL + anon key from the server so the
 * OAuth call works even when NEXT_PUBLIC_* wasn't inlined at build time.
 */
export function RegistrationCard({
  config,
}: {
  config?: PublicSupabaseConfig;
}) {
  return (
    <div className="corner-frame paper-panel relative border border-gold/30 bg-card p-6 sm:p-8">
      <div aria-hidden className="absolute inset-2 border border-gold/10" />
      <div className="relative">
        <p className="eyebrow">Start here</p>
        <h2 className="font-serif-display mt-2 text-2xl text-charcoal">
          Sign in to begin
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your Google account to sign in or create your account — it&rsquo;s
          the fastest, most secure way in. New here? Continuing with Google sets
          up your account automatically.
        </p>

        <div className="mt-6">
          <GoogleButton label="Continue with Google" config={config} />
        </div>

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
