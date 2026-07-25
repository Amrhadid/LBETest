import Link from "next/link";
import { Check } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pricingPlans } from "@/lib/site";

const plans = [
  {
    title: "Test Only",
    price: "$89",
    note: "One-time payment",
    features: [
      "Full online LBE test",
      "LBE score and qualification",
      "Skill breakdown",
      "Verifiable digital certificate",
    ],
    cta: "Book Test Only",
    href: pricingPlans.testOnly.href,
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Test + Training",
    price: "$189",
    note: "One-time payment",
    features: [
      "Everything in Test Only",
      "Complete LBE preparation training",
      "Workplace language practice",
      "Test-taking strategies",
    ],
    cta: "Get Test + Training",
    href: pricingPlans.testTraining.href,
    featured: true,
    badge: "Best value",
  },
];

export function Pricing() {
  return (
    <Section id="pricing" surface="white">
      <SectionHeading
        eyebrow="Simple pricing"
        title="Choose how you want to prepare."
        description="One payment. No hidden fees."
      />

      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className={cn(
              "paper-panel relative flex flex-col overflow-hidden bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
              plan.featured
                ? "border border-gold shadow-lift ring-4 ring-gold/5"
                : "border border-gold/25",
            )}
          >
            {plan.badge && (
              <span className="gold-foil absolute right-[-3.4rem] top-7 w-48 rotate-45 py-2 text-center text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white shadow-gold">
                {plan.badge}
              </span>
            )}
            <h3 className="font-serif-display text-2xl text-charcoal">{plan.title}</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif-display text-5xl text-charcoal tabular-nums">
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground">{plan.note}</span>
            </div>

            <ul className="mt-7 flex-1 space-y-3.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[15px] text-charcoal">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/12 text-gold">
                    <Check className="size-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <Button
              asChild
              variant={plan.featured ? "gold" : "outline"}
              size="lg"
              className="mt-8 w-full"
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}
