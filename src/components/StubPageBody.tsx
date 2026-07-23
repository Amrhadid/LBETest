import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";

/** Simple, on-brand placeholder body for routes that aren't built out yet. */
export function StubPageBody({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryHref = "/start",
  primaryLabel = "Take the test",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <Section className="bg-hero-radial">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/8 text-primary-mid">
          <Icon className="size-7" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-teal">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="teal" size="lg">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          This page is a placeholder in the marketing preview — full content
          lands in a later milestone.
        </p>
      </div>
    </Section>
  );
}
