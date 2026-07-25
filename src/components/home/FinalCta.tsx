import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-20">
          {/* Decorative glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(50% 60% at 20% 0%, rgb(18 179 166 / 0.35), transparent 60%), radial-gradient(50% 60% at 90% 100%, rgb(30 90 168 / 0.45), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to prove your Business English?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Sit the exam today and walk away with a certificate you can share
              and verify in minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="teal" size="lg">
                <Link href="/start">
                  Take the test
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/for-business">Explore for business</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
