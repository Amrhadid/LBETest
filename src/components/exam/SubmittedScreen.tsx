import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown after an attempt is submitted. No score/level is revealed. */
export function SubmittedScreen() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
        <CheckCircle2 className="size-8" strokeWidth={1.5} />
      </span>
      <h1 className="font-serif-display mt-6 text-4xl text-charcoal sm:text-5xl">
        Submitted
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Your responses have been recorded. Your results will be available once
        grading is complete.
      </p>
      <div className="mt-8">
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
