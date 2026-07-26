"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient, type PublicSupabaseConfig } from "@/lib/supabase/client";

/**
 * "Continue with Google" OAuth button. Uses the browser Supabase client to
 * start the OAuth flow and returns to the existing /auth/callback route (the
 * same PKCE callback used by magic-link), which exchanges the code and lands
 * the user on /dashboard.
 *
 * `config` carries the public Supabase URL + anon key from the server so the
 * browser client works even when NEXT_PUBLIC_* wasn't inlined at build time.
 */
export function GoogleButton({
  label = "Continue with Google",
  className,
  config,
}: {
  label?: string;
  className?: string;
  config?: PublicSupabaseConfig;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient(config);
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // On success the browser is redirected to Google; keep the spinner up
      // until navigation happens (do not clear loading here).
    } catch {
      setError("Could not start Google sign-in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gold/45 bg-transparent text-base font-semibold text-charcoal transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin text-gold" aria-hidden />
        ) : (
          <GoogleGlyph className="size-5" />
        )}
        {loading ? "Redirecting…" : label}
      </button>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Official multi-color Google "G" mark (inline so it stays CSP-safe). */
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
