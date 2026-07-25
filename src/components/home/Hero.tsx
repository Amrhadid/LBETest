import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Certificate } from "@/components/home/Certificate";
import { RegistrationCard } from "@/components/home/RegistrationCard";

const trustFacts = ["Online test", "Results in 48 hours", "Verifiable certificate"];
const infoBand = ["4 skills assessed", "Workplace language", "Unique certificate ID"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft security-pattern wash behind the hero */}
      <div
        aria-hidden
        className="pattern-guilloche pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]"
      />

      <div className="container mx-auto py-14 sm:py-16 lg:py-24">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-14 lg:gap-y-6 lg:[grid-template-areas:'text_form''cert_form''band_band']">
          {/* A — editorial text */}
          <div className="animate-fade-up lg:[grid-area:text] lg:self-center">
            <p className="eyebrow">Business English. Officially proven.</p>
            <h1 className="font-serif-display mt-4 text-[2.6rem] leading-[1.04] text-charcoal sm:text-6xl">
              The world&rsquo;s first Business English test
            </h1>
            <p className="mt-5 text-xl text-muted-foreground">
              LBE3 means you&rsquo;re{" "}
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

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {trustFacts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-center gap-2 text-sm font-medium text-charcoal"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-gold/12 text-gold">
                    <Check className="size-3.5" />
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          {/* B — registration card */}
          <div className="animate-fade-up [animation-delay:80ms] lg:[grid-area:form] lg:self-start">
            <RegistrationCard />
          </div>

          {/* C — certificate visual */}
          <div className="animate-fade-up [animation-delay:160ms] pt-2 lg:[grid-area:cert] lg:pt-6">
            <Certificate />
          </div>

          {/* D — compact information band */}
          <div className="lg:[grid-area:band]">
            <ul className="flex flex-col divide-y divide-gold/20 overflow-hidden rounded-xl border border-gold/25 bg-card shadow-card sm:flex-row sm:divide-x sm:divide-y-0">
              {infoBand.map((item) => (
                <li
                  key={item}
                  className="flex-1 px-5 py-3.5 text-center text-sm font-medium text-charcoal"
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
