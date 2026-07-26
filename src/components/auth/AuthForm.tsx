"use client";

import { GoogleButton } from "@/components/auth/GoogleButton";
import type { PublicSupabaseConfig } from "@/lib/supabase/client";

/**
 * Authentication is Google-only. Sign-in and sign-up are the same action —
 * Google creates the account on first login and signs in on return.
 *
 * `config` is the public Supabase URL + anon key, provided by the server so the
 * OAuth call works regardless of build-time env inlining.
 */
export function AuthForm({ config }: { config?: PublicSupabaseConfig }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-gold/25 bg-card p-6 text-center shadow-card sm:p-8">
        <p className="mb-6 text-sm text-muted-foreground">
          Use your Google account to sign in or create an account. It&rsquo;s the
          fastest and most secure way in — no password to remember.
        </p>

        <GoogleButton label="Continue with Google" config={config} />

        <p className="mt-6 text-xs text-muted-foreground">
          New here? Continuing with Google creates your account automatically.
        </p>
      </div>
    </div>
  );
}
