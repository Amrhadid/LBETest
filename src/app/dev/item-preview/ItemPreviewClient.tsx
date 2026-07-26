"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  type ExamItem,
  type ResponseAnswer,
  type LbeLevel,
  QuestionType,
  QUESTION_TYPE_LABELS,
} from "@/lib/exam/types";
import { getSectionResult, type GradedInput } from "@/lib/exam/scoring";
import { SectionBadge } from "@/components/exam/SectionBadge";
import { SourceStimulus } from "@/components/exam/SourceStimulus";
import { QuestionRenderer } from "@/components/exam/QuestionRenderer";

/** Interactive preview: renders every seed item and shows live provisional
 *  pass/fail per section as answers change. Capture-only (no uploads). */
export function ItemPreviewClient({ items }: { items: ExamItem[] }) {
  const [answers, setAnswers] = React.useState<Record<string, ResponseAnswer>>({});

  const setAnswer = React.useCallback((id: string, answer: ResponseAnswer) => {
    setAnswers((prev) => ({ ...prev, [id]: answer }));
  }, []);

  // Group items by section (lbe_level), preserving level order 1..5.
  const sections = React.useMemo(() => {
    const byLevel = new Map<LbeLevel, ExamItem[]>();
    for (const item of items) {
      const list = byLevel.get(item.lbe_level) ?? [];
      list.push(item);
      byLevel.set(item.lbe_level, list);
    }
    return [...byLevel.entries()].sort((a, b) => a[0] - b[0]);
  }, [items]);

  return (
    <div className="space-y-16">
      {sections.map(([level, sectionItems]) => {
        const graded: GradedInput[] = sectionItems.map((item) => ({
          item,
          answer: answers[item.id] ?? null,
        }));
        const result = getSectionResult(graded, level);

        return (
          <section key={level} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 pb-4">
              <SectionBadge level={level} />
              <ProvisionalResult result={result} />
            </div>

            <ol className="space-y-8">
              {sectionItems.map((item, idx) => (
                <li key={item.id} className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif-display text-2xl text-gold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {QUESTION_TYPE_LABELS[item.question_type]} · Type{" "}
                        {item.question_type}
                      </p>
                      {item.prompt && (
                        <p className="mt-1 text-charcoal">{item.prompt}</p>
                      )}
                    </div>
                  </div>

                  <SourceStimulus item={item} />

                  <QuestionRenderer
                    item={item}
                    value={answers[item.id] ?? null}
                    onChange={(a) => setAnswer(item.id, a)}
                    revealResult
                  />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function ProvisionalResult({
  result,
}: {
  result: ReturnType<typeof getSectionResult>;
}) {
  return (
    <div className="text-right">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
          result.provisionalPass
            ? "border-green-500/50 bg-green-50 text-green-700"
            : "border-amber-400/50 bg-amber-50 text-amber-700",
        )}
      >
        Provisional: {result.provisionalPass ? "PASS" : "not yet"} ·{" "}
        {result.correctCount}/{result.threshold} needed
      </span>
      <p className="mt-1 text-xs text-muted-foreground">
        auto-graded {result.correctCount}/{result.autoGradedCount} correct ·{" "}
        {result.pendingCount} pending AI grade (types{" "}
        {[QuestionType.RespondToSituation, QuestionType.WriteTheDefinition, QuestionType.SpeakAboutSource].join("/")})
      </p>
    </div>
  );
}
