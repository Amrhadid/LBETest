import { ClipboardCheck, MonitorPlay, ShieldCheck } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";

const steps = [
  {
    icon: MonitorPlay,
    title: "Take the test online",
    blurb:
      "Sit the ~60-minute adaptive exam from any browser, whenever suits you. No test center, no appointment.",
  },
  {
    icon: ClipboardCheck,
    title: "Get your score instantly",
    blurb:
      "Auto-scored sections return the moment you finish, with a CEFR level and a skill-by-skill breakdown.",
  },
  {
    icon: ShieldCheck,
    title: "Share a verifiable certificate",
    blurb:
      "Send a secure link or PDF. Anyone can confirm it’s genuine on lbetest.com/verify — no login required.",
  },
];

export function HowItWorks() {
  return (
    <Section muted>
      <SectionHeading
        eyebrow="How it works"
        title="From sign-in to certificate in an afternoon"
      />

      <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
        {/* Connecting line on desktop */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
        />
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex flex-col items-start">
            <div className="flex items-center gap-4">
              <span className="relative flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-primary-mid shadow-soft">
                <step.icon className="size-6" />
                <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-teal text-xs font-bold text-teal-foreground tabular-nums shadow-teal-glow">
                  {i + 1}
                </span>
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
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
