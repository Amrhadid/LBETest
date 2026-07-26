"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { QuestionType, type ExamItem, type ResponseAnswer } from "@/lib/exam/types";
import { scoreResponse } from "@/lib/exam/scoring";

/**
 * Single-select MCQ for question types 1 (choose the correct answer) and
 * 2 (choose the wrong answer). Auto-graded against `answer_key.correct`.
 *
 * The two types share the selection mechanic and differ only in instruction
 * text; grading treats `answer_key.correct` as the intended selection for both.
 */
export function SingleSelectQuestion({
  item,
  value,
  onChange,
  disabled,
  revealResult,
}: {
  item: ExamItem;
  value: ResponseAnswer;
  onChange: (answer: ResponseAnswer) => void;
  disabled?: boolean;
  /** Preview/review affordance: show which option is correct after answering. */
  revealResult?: boolean;
}) {
  const selected = value && "selected" in value ? value.selected : undefined;
  const options = item.options ?? [];
  const correct =
    item.answer_key && typeof item.answer_key === "object" && "correct" in item.answer_key
      ? (item.answer_key.correct as string)
      : undefined;

  const instruction =
    item.question_type === QuestionType.ChooseWrong
      ? "Select the option that is NOT correct."
      : "Select the correct option.";

  const name = `q-${item.id}`;

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="sr-only">{instruction}</legend>
      <p className="text-sm font-medium text-gold">{instruction}</p>
      <div className="space-y-2.5">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = revealResult && correct === opt.id;
          const isWrongPick = revealResult && isSelected && correct !== opt.id;
          return (
            <label
              key={opt.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[0.975rem] transition-colors",
                isSelected
                  ? "border-gold bg-gold/8"
                  : "border-gold/25 bg-card hover:bg-gold/5",
                isCorrect && "border-green-500/60 bg-green-50",
                isWrongPick && "border-red-400/60 bg-red-50",
                disabled && "cursor-not-allowed opacity-80",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.id}
                checked={isSelected}
                onChange={() => onChange({ selected: opt.id })}
                className="mt-1 size-4 accent-[rgb(198_138_30)]"
              />
              <span className="flex-1 text-charcoal">
                <span className="mr-2 font-semibold uppercase text-muted-foreground">
                  {opt.id}
                </span>
                {opt.text}
              </span>
              {isCorrect && <Check className="mt-0.5 size-4 text-green-600" />}
            </label>
          );
        })}
      </div>

      {revealResult && selected && (
        <ResultLine item={item} value={value} />
      )}
    </fieldset>
  );
}

function ResultLine({ item, value }: { item: ExamItem; value: ResponseAnswer }) {
  const result = scoreResponse(item, value);
  if (!result) return null;
  return (
    <p
      className={cn(
        "text-xs font-semibold",
        result.is_correct ? "text-green-700" : "text-red-700",
      )}
    >
      {result.is_correct ? "Correct" : "Incorrect"}
    </p>
  );
}
