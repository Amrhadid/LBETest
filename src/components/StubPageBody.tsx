import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/site";

/** On-brand placeholder body for routes that aren't built out yet. */
export function StubPageBody({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryHref = routes.book,
  primaryLabel = "Book a Test",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <Section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pattern-guilloche pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
          <Icon className="size-7" strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-6">{eyebrow}</p>
        <h1 className="font-serif-display mt-3 text-4xl text-charcoal sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg">
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
