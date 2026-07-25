"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { routes } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";

export function VerifyCertificate() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const inputId = React.useId();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    // Connect to the existing certificate-verification route. The real lookup
    // + result state live on /verify.
    // TODO(backend): when the verification API is available, return the
    // polished result state (verified, candidate name, LBE score,
    // qualification status, issue date, certificate ID) — no fabricated data.
    router.push(
      trimmed ? `${routes.verify}?code=${encodeURIComponent(trimmed)}` : routes.verify,
    );
  }

  return (
    <section id="verify" className="relative overflow-hidden border-y border-gold/35 bg-charcoal-dark">
      {/* Restrained gold security-line decoration */}
      <div
        aria-hidden
        className="pattern-security-dark pointer-events-none absolute inset-0 opacity-70"
      />
      <div aria-hidden className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/10 shadow-[0_0_0_40px_rgb(198_138_30/.025),0_0_0_80px_rgb(198_138_30/.02)]" />
      <div className="container relative mx-auto py-20 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left copy */}
          <Reveal>
            <p className="eyebrow text-gold-soft">Certificate verification</p>
            <h2 className="font-serif-display mt-4 text-4xl leading-[1.08] text-white sm:text-5xl">
              Verify an LBE certificate in seconds.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
              Enter the certificate ID to confirm the holder&rsquo;s identity, LBE
              score and qualification status.
            </p>
          </Reveal>

          {/* Right panel */}
          <Reveal delay={120} className="corner-frame paper-panel relative border border-gold/35 bg-card p-7 shadow-lift sm:p-9">
            <span className="gold-foil flex size-14 items-center justify-center rounded-full text-white shadow-gold">
              <ShieldCheck className="size-6" />
            </span>
            <form onSubmit={onSubmit} className="mt-5">
              <label
                htmlFor={inputId}
                className="mb-1.5 block text-sm font-medium text-charcoal"
              >
                Certificate ID
              </label>
              <input
                id={inputId}
                name="code"
                type="text"
                autoComplete="off"
                placeholder="e.g. LBE-2026-000184"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex h-12 w-full rounded-lg border border-gold/30 bg-card px-4 text-sm tabular-nums text-charcoal shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              />
              <Button type="submit" variant="gold" size="lg" className="mt-4 w-full">
                Verify Certificate
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Secure and publicly accessible.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
