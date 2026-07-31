import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Certificate } from "@/components/home/Certificate";
import { RegistrationCard } from "@/components/home/RegistrationCard";
import type { PublicSupabaseConfig } from "@/lib/supabase/client";

const trustFacts = ["Online test", "Results in 48 hours", "Verifiable certificate"];
const infoBand = ["4 skills assessed", "Workplace language", "Unique certificate ID"];

export function Hero({ config }: { config?: PublicSupabaseConfig }) {
  return (
    <section className="relative overflow-hidden border-b border-gold/25">
      {/* Soft security-pattern wash behind the hero */}
      <div
        aria-hidden
        className="pattern-guilloche pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]"
      />
      <div aria-hidden className="absolute -left-40 top-16 size-[30rem] rounded-full border border-gold/10" />
      <div aria-hidden className="absolute -left-28 top-28 size-[22rem] rounded-full border border-gold/10" />

      <div className="container mx-auto py-14 sm:py-16 lg:py-24">
        <div className="corner-frame relative flex flex-col gap-10 border-x border-gold/15 px-4 py-6 sm:px-8 lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:gap-x-16 lg:gap-y-8 lg:px-12 lg:py-10 lg:[grid-template-areas:'text_form''cert_form''band_band']">
          {/* A — editorial text */}
          <div className="animate-fade-up lg:[grid-area:text] lg:self-center">
            <p className="eyebrow">Business English. Officially proven.</p>
            <h1 className="font-serif-display mt-5 text-[3rem] leading-[0.96] text-charcoal sm:text-7xl lg:text-[5.1rem]">
              The world&rsquo;s first Business English test
            </h1>
            <p className="mt-7 max-w-md border-l border-gold/40 pl-5 text-xl text-muted-foreground">
              <span className="font-serif-display text-gold">LBE3</span> means you&rsquo;re{" "}
              <span className="font-serif-display italic text-charcoal">
                &ldquo;Qualified&rdquo;
              </span>
            </p>
            <Link
              href="#score-system"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-gold transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              See how the score works
              <ArrowRight className="size-4" />
            </Link>

            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-gold/20 pt-5">
              {trustFacts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-center gap-2 text-sm font-medium text-charcoal"
                >
                  <span className="flex size-6 items-center justify-center rounded-full border border-gold/35 bg-card text-gold shadow-sm">
                    <Check className="size-3.5" />
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          {/* B — registration card */}
          <div className="animate-fade-up [animation-delay:80ms] lg:[grid-area:form] lg:self-start">
            <RegistrationCard config={config} />
          </div>

          {/* C — certificate visual */}
          <div className="animate-fade-up [animation-delay:160ms] pt-2 lg:[grid-area:cert] lg:pt-6">
            <Certificate />
          </div>

          {/* D — compact information band */}
          <div className="lg:[grid-area:band]">
            <ul className="engraved-band paper-panel flex flex-col divide-y divide-gold/20 overflow-hidden bg-card/90 sm:flex-row sm:divide-x sm:divide-y-0">
              {infoBand.map((item) => (
                <li
                  key={item}
                  className="flex-1 px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-charcoal"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
