import { MonitorCheck, ScrollText, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";

type Step = { n: string; icon: LucideIcon; title: string; blurb: string };

const steps: Step[] = [
  {
    n: "01",
    icon: MonitorCheck,
    title: "Take the test online",
    blurb: "Complete the secure Business English test from your own computer.",
  },
  {
    n: "02",
    icon: ScrollText,
    title: "Receive your LBE score",
    blurb: "Get your level, workplace qualification and skill breakdown.",
  },
  {
    n: "03",
    icon: Share2,
    title: "Share your certificate",
    blurb: "Download it, share it and let anyone verify it online.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="From booking to certificate in three steps."
      />

      <ol className="relative mt-16 grid gap-8 md:grid-cols-3">
        {/* Connecting line on desktop */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent md:block"
        />
        {steps.map((step) => (
          <li
            key={step.n}
            className="relative flex flex-col items-start rounded-2xl border border-gold/25 bg-card p-7 shadow-card"
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
                <step.icon className="size-6" strokeWidth={1.5} />
              </span>
              <span className="font-serif-display text-3xl text-gold/40 tabular-nums">
                {step.n}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-charcoal">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {step.blurb}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
