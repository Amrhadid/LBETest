import Link from "next/link";
import {
  BadgeCheck,
  Clock,
  Globe,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExamMock } from "@/components/home/ExamMock";

const trustPoints = [
  { icon: Globe, label: "100% online" },
  { icon: Clock, label: "~60 minutes" },
  { icon: Zap, label: "Instant score" },
  { icon: ShieldCheck, label: "Verifiable certificate" },
];

export function Hero() {
  return (
    <section id="the-test" className="relative overflow-hidden bg-hero-radial">
      {/* Fine grid backdrop, masked toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(148 163 184 / 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.16) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="container mx-auto grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-28">
        <div className="max-w-xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
            <BadgeCheck className="size-4" />
            CEFR-aligned · A1–C2
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Prove your{" "}
            <span className="text-gradient-brand">Business English.</span>
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            LBET measures the English you actually use at work — meetings,
            email, reports and calls — then issues a certificate employers can
            verify in seconds.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="teal" size="lg">
              <Link href="/start">Take the test</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#sample">Try a sample question</Link>
            </Button>
          </div>

          {/* Trust strip */}
          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            {trustPoints.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <Icon className="size-4 text-teal" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <ExamMock />
        </div>
      </div>
    </section>
  );
}
