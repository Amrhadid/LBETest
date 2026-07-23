import Link from "next/link";
import { Check } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Single test",
    price: "$39",
    unit: "one-off",
    blurb: "One full exam, your certificate, and a skill breakdown.",
    features: ["Full ~60-min exam", "Instant CEFR score", "Verifiable certificate"],
    cta: "Take the test",
    href: "/start",
    featured: false,
  },
  {
    name: "Retake bundle",
    price: "$59",
    unit: "2 attempts",
    blurb: "Practice, then certify. Take your best score to the finish line.",
    features: [
      "Two full exams",
      "Detailed feedback report",
      "Retake within 90 days",
    ],
    cta: "Get the bundle",
    href: "/start?plan=bundle",
    featured: true,
  },
  {
    name: "Teams & Schools",
    price: "Custom",
    unit: "volume",
    blurb: "Seats, proctoring options and analytics for cohorts of any size.",
    features: ["Bulk seat pricing", "Admin dashboard", "Invoicing & SSO"],
    cta: "Talk to sales",
    href: "/for-business",
    featured: false,
  },
];

export function PricingTeaser() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title="Straightforward pricing, no test-center fees"
        description="Pay per test or per seat. Every plan includes a verifiable certificate."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col p-7",
              plan.featured
                ? "border-teal/50 shadow-lift ring-1 ring-teal/30"
                : "",
            )}
          >
            {plan.featured && (
              <span className="absolute right-6 top-6 rounded-full bg-teal px-2.5 py-1 text-xs font-semibold text-teal-foreground">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-heading text-4xl font-bold tabular-nums text-foreground">
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground">/ {plan.unit}</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              {plan.blurb}
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal/12 text-teal">
                    <Check className="size-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <Button
              asChild
              variant={plan.featured ? "teal" : "outline"}
              className="mt-7 w-full"
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Prices shown in USD. Full pricing details on the{" "}
        <Link href="#pricing" className="font-medium text-primary-mid hover:underline">
          pricing page
        </Link>
        .
      </p>
    </Section>
  );
}
