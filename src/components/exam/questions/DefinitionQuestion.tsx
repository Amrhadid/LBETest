"use client";

import { Sparkles } from "lucide-react";

import type { ExamItem, ResponseAnswer } from "@/lib/exam/types";

/**
 * Type 5 — given a term, write the definition. Free-text is captured only; no
 * auto-grading here (AI grading is a separate later step).
 */
export function DefinitionQuestion({
  item,
  value,
  onChange,
  disabled,
}: {
  item: ExamItem;
  value: ResponseAnswer;
  onChange: (answer: ResponseAnswer) => void;
  disabled?: boolean;
}) {
  const definition = value && "definition" in value ? value.definition : "";

  return (
    <div className="space-y-2">
      <label
        htmlFor={`def-${item.id}`}
        className="block text-sm font-medium text-gold"
      >
        Write the definition:
      </label>
      <textarea
        id={`def-${item.id}`}
        value={definition}
        disabled={disabled}
        rows={4}
        placeholder="Write your definition in your own words…"
        onChange={(e) => onChange({ definition: e.target.value })}
        className="w-full rounded-lg border border-gold/30 bg-card px-4 py-3 text-sm text-charcoal shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      />
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-gold" />
        Captured for AI grading in a later step — no instant score.
      </p>
    </div>
  );
}
