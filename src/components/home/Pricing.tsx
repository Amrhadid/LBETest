import { Check } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pricingPlans, contact } from "@/lib/site";
import { getLatestUsdRate } from "@/lib/pricing/rate.server";
import { usdFromEgp } from "@/lib/pricing/exchange-rate";

export async function Pricing() {
  // Read the cached daily rate server-side (no live FX call on page load).
  const rate = await getLatestUsdRate();

  const plans = [
    {
      title: "Test Only",
      priceEgp: pricingPlans.testOnly.priceEgp,
      usd: usdFromEgp(pricingPlans.testOnly.egpAmount, rate),
      features: [
        "Full online LBE test",
        "LBE score and qualification",
        "Skill breakdown",
        "Verifiable digital certificate",
      ],
      cta: "Buy Test Only",
      href: pricingPlans.testOnly.href,
      featured: false,
      badge: null as string | null,
    },
    {
      title: "Test + Training",
      priceEgp: pricingPlans.testTraining.priceEgp,
      usd: usdFromEgp(pricingPlans.testTraining.egpAmount, rate),
      features: [
        "Everything in Test Only",
        "Complete LBE preparation training",
        "Workplace language practice",
        "Test-taking strategies",
      ],
      cta: "Buy Test + Training",
      href: pricingPlans.testTraining.href,
      featured: true,
      badge: "Best value",
    },
  ];

  return (
    <Section id="pricing" surface="white">
      <SectionHeading
        eyebrow="Simple pricing"
        title="Choose how you want to prepare."
        description="One payment. No hidden fees."
      />

      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((plan, i) => (
          <Reveal
            key={plan.title}
            delay={i * 130}
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
              <span className="font-serif-display text-4xl text-charcoal tabular-nums sm:text-5xl">
                {plan.priceEgp}
              </span>
              {plan.usd != null && (
                <span className="text-sm text-muted-foreground">
                  (≈ ${plan.usd} USD)
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              One-time payment
            </p>

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
              <a href={plan.href} target="_blank" rel="noopener noreferrer">
                {plan.cta}
              </a>
            </Button>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-2xl text-center">
        <p className="text-sm text-muted-foreground">
          Prefer to pay manually? Message us on{" "}
          <a
            href={contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold underline-offset-4 hover:underline"
          >
            WhatsApp ({contact.whatsapp})
          </a>{" "}
          and we&rsquo;ll arrange your access code.
        </p>
      </Reveal>
    </Section>
  );
}
