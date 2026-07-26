"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Route-level error boundary. Turns an unexpected server/client exception into
 * a branded, recoverable page instead of the raw "Application error" screen.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
        <AlertTriangle className="size-7" strokeWidth={1.5} />
      </span>
      <h1 className="font-serif-display mt-6 text-3xl text-charcoal sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        We hit an unexpected error. Please try again — if it keeps happening,
        sign in again or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-sheen gold-foil inline-flex h-12 items-center justify-center rounded-lg border border-gold/40 px-7 text-base font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:brightness-[1.06]"
        >
          Try again
        </button>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-gold/45 px-7 text-base font-semibold text-charcoal transition-colors hover:bg-gold/8"
        >
          Go to sign in
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-lg px-7 text-base font-semibold text-charcoal hover:bg-gold/8"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
