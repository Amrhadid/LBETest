import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Material tab — text/interactive lessons. For now it holds one lesson,
 * "Introduce Yourself". (The broader interactive-reader content model is still
 * an open question and intentionally not built here.)
 */
export default function MaterialTab() {
  return (
    <div className="space-y-4">
      <Link
        href="/training/material/introduce-yourself"
        className="group block rounded-2xl border border-gold/25 bg-card p-5 shadow-card transition-colors hover:border-gold/50"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/8 text-gold">
              <PenLine className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                Lesson 1
              </p>
              <h3 className="mt-0.5 text-lg font-semibold text-charcoal">
                Introduce Yourself
              </h3>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Answer a few questions and get a polished self-introduction you
                can use in interviews and at work — then edit and regenerate any
                time.
              </p>
            </div>
          </div>
          <ArrowRight className="size-5 shrink-0 text-gold transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </div>
  );
}
