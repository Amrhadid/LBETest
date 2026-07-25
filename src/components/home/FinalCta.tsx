import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/site";

export function FinalCta() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto">
        <div className="corner-frame relative overflow-hidden border border-gold/45 bg-charcoal-dark px-6 py-16 text-center shadow-[0_30px_80px_-35px_rgb(29_29_31/.65)] sm:px-12 sm:py-20">
          {/* Subtle certificate-security pattern + gold wash */}
          <div
            aria-hidden
            className="pattern-security-dark pointer-events-none absolute inset-0 opacity-80"
          />
          <div aria-hidden className="absolute inset-3 border border-gold/15" />
          <div aria-hidden className="ornament-rule absolute left-1/2 top-10 w-48 -translate-x-1/2 text-gold"><span className="size-2 rotate-45 border border-gold/70" /></div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(50% 100% at 50% 0%, rgb(198 138 30 / 0.35), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-serif-display text-4xl leading-[1.02] text-white sm:text-6xl">
              Ready to prove your Business English?
            </h2>
            <p className="mt-5 text-lg text-white/75">
              Book your LBE test and earn a qualification built for the
              workplace.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href={routes.book}>Book a Test</Link>
              </Button>
              <Button asChild variant="onDark" size="lg">
                <Link href={routes.signIn}>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
