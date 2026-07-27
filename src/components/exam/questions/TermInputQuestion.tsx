"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { ExamItem, ResponseAnswer } from "@/lib/exam/types";
import { scoreResponse } from "@/lib/exam/scoring";

/**
 * Type 4 — given a definition, name the term. Short text input, auto-graded via
 * case-insensitive exact/fuzzy match against `answer_key.accept`.
 */
export function TermInputQuestion({
  item,
  value,
  onChange,
  disabled,
  revealResult,
  disableClipboard,
}: {
  item: ExamItem;
  value: ResponseAnswer;
  onChange: (answer: ResponseAnswer) => void;
  disabled?: boolean;
  revealResult?: boolean;
  /** Exam lockdown: block copy/paste/cut so the answer is typed, not pasted. */
  disableClipboard?: boolean;
}) {
  const text = value && "text" in value ? value.text : "";
  const result = revealResult && text ? scoreResponse(item, value) : null;
  const blockClipboard = disableClipboard
    ? (e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()
    : undefined;

  const accepted =
    item.answer_key && typeof item.answer_key === "object" && "accept" in item.answer_key
      ? (item.answer_key.accept as string[])
      : [];

  return (
    <div className="space-y-2">
      <label
        htmlFor={`term-${item.id}`}
        className="block text-sm font-medium text-gold"
      >
        Type the term:
      </label>
      <Input
        id={`term-${item.id}`}
        value={text}
        disabled={disabled}
        autoComplete="off"
        placeholder="Your answer"
        onChange={(e) => onChange({ text: e.target.value })}
        onCopy={blockClipboard}
        onCut={blockClipboard}
        onPaste={blockClipboard}
        className="max-w-sm"
      />
      {result && (
        <p
          className={cn(
            "text-xs font-semibold",
            result.is_correct ? "text-green-700" : "text-red-700",
          )}
        >
          {result.is_correct
            ? "Correct"
            : `Incorrect${accepted.length ? ` — expected: ${accepted[0]}` : ""}`}
        </p>
      )}
    </div>
  );
}
