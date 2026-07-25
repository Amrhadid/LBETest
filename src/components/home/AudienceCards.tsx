import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, User } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";
import { Card } from "@/components/ui/card";

const audiences = [
  {
    icon: User,
    title: "For Individuals",
    blurb:
      "Certify your level for a job application, a promotion or a visa — and stand out with proof, not a self-rating.",
    href: "/for-individuals",
    cta: "Test yourself",
  },
  {
    icon: Building2,
    title: "For Business",
    blurb:
      "Benchmark teams, screen candidates and track training ROI with consistent, comparable scores.",
    href: "/for-business",
    cta: "Assess your team",
  },
  {
    icon: GraduationCap,
    title: "For Schools",
    blurb:
      "Give students an internationally recognized credential and measure progress across cohorts.",
    href: "/for-institutions",
    cta: "Partner with us",
  },
];

export function AudienceCards() {
  return (
    <Section muted>
      <SectionHeading
        eyebrow="Who it's for"
        title="Built for everyone who needs proof of English"
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {audiences.map(({ icon: Icon, title, blurb, href, cta }) => (
          <Card
            key={title}
            className="group flex flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:border-teal/40 hover:shadow-lift"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary-mid transition-colors group-hover:bg-teal/12 group-hover:text-teal">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
              {blurb}
            </p>
            <Link
              href={href}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-mid transition-colors hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
            >
              {cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Card>
        ))}
      </div>
    </Section>
  );
}
