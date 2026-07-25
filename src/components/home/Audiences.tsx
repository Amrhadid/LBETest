import Link from "next/link";
import { ArrowRight, User, Building, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";
import { routes } from "@/lib/site";

type Audience = {
  icon: LucideIcon;
  title: string;
  blurb: string;
  cta: string;
  href: string;
};

const audiences: Audience[] = [
  {
    icon: User,
    title: "Individuals",
    blurb:
      "Prove your workplace English for jobs, promotions and professional growth.",
    cta: "Book your test",
    href: routes.individuals,
  },
  {
    icon: Building,
    title: "Organizations",
    blurb:
      "Assess learners or members with one consistent Business English standard.",
    cta: "Explore solutions",
    href: routes.organizations,
  },
  {
    icon: Briefcase,
    title: "Businesses",
    blurb:
      "Screen candidates, benchmark teams and measure training outcomes.",
    cta: "Test your team",
    href: routes.businesses,
  },
];

export function Audiences() {
  return (
    <Section id="audiences">
      <SectionHeading
        eyebrow="Who it's for"
        title="One test. Three ways to use it."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {audiences.map(({ icon: Icon, title, blurb, cta, href }) => (
          <div
            key={title}
            className="corner-frame paper-panel group relative flex flex-col border border-gold/25 bg-card p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-lift"
          >
            <span className="flex size-14 items-center justify-center rounded-full border border-gold/35 bg-card text-gold shadow-[0_0_0_6px_rgb(198_138_30/.06)]">
              <Icon className="size-6" strokeWidth={1.5} />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-charcoal">{title}</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
              {blurb}
            </p>
            <Link
              href={href}
              className="mt-6 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-gold transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
