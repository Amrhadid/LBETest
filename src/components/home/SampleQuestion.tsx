"use client";

import * as React from "react";
import { Check, X, RotateCcw, Sparkles } from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option = { id: string; text: string };

const question = {
  context:
    "You receive this message from a colleague before a client meeting:",
  quote:
    "“Can you touch base with the client and loop me in once you have an update?”",
  prompt: "What is your colleague asking you to do?",
  options: [
    { id: "a", text: "Physically meet the client at their office." },
    { id: "b", text: "Contact the client, then keep them informed." },
    { id: "c", text: "Wait for the client to reach out first." },
    { id: "d", text: "Forward the client’s details to the team." },
  ] as Option[],
  correct: "b",
  explanation:
    "“Touch base” means to make brief contact, and “loop me in” means to keep someone informed — so you should reach out to the client and then update your colleague.",
};

export function SampleQuestion() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const isCorrect = submitted && selected === question.correct;

  function reset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <Section id="sample">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <SectionHeading
          align="left"
          eyebrow="Try it yourself"
          title="A real LBET question"
          description="This is the kind of everyday, on-the-job English LBET measures. Pick an answer to see instant feedback — exactly like the live exam."
          className="max-w-none"
        />

        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary-mid">
              <Sparkles className="size-3.5" />
              Reading · B1–B2
            </span>
            {submitted && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  isCorrect
                    ? "bg-success/12 text-success"
                    : "bg-error/12 text-error",
                )}
                role="status"
              >
                {isCorrect ? (
                  <>
                    <Check className="size-3.5" /> Correct
                  </>
                ) : (
                  <>
                    <X className="size-3.5" /> Not quite
                  </>
                )}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm text-muted-foreground">{question.context}</p>
          <blockquote className="mt-2 border-l-2 border-teal pl-4 text-[15px] font-medium italic text-foreground">
            {question.quote}
          </blockquote>
          <p className="mt-5 font-semibold text-foreground">{question.prompt}</p>

          <fieldset className="mt-4 space-y-2.5" aria-label={question.prompt}>
            {question.options.map((opt) => {
              const chosen = selected === opt.id;
              const isRight = opt.id === question.correct;
              const showRight = submitted && isRight;
              const showWrong = submitted && chosen && !isRight;

              return (
                <label
                  key={opt.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                    !submitted &&
                      (chosen
                        ? "border-primary-mid bg-primary/5 text-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"),
                    showRight && "border-success bg-success/8 text-foreground",
                    showWrong && "border-error bg-error/8 text-foreground",
                    submitted &&
                      !showRight &&
                      !showWrong &&
                      "border-border bg-background text-muted-foreground",
                    submitted && "cursor-default",
                  )}
                >
                  <input
                    type="radio"
                    name="sample-answer"
                    value={opt.id}
                    checked={chosen}
                    disabled={submitted}
                    onChange={() => setSelected(opt.id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold uppercase",
                      !submitted &&
                        (chosen
                          ? "border-primary-mid bg-primary-mid text-white"
                          : "border-border text-muted-foreground"),
                      showRight && "border-success bg-success text-white",
                      showWrong && "border-error bg-error text-white",
                      submitted &&
                        !showRight &&
                        !showWrong &&
                        "border-border text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {showRight ? (
                      <Check className="size-3.5" />
                    ) : showWrong ? (
                      <X className="size-3.5" />
                    ) : (
                      opt.id
                    )}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </label>
              );
            })}
          </fieldset>

          {submitted && (
            <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground animate-fade-up">
              <span className="font-semibold text-foreground">Why: </span>
              {question.explanation}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            {!submitted ? (
              <Button
                type="button"
                variant="primary"
                disabled={selected === null}
                onClick={() => setSubmitted(true)}
              >
                Check answer
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={reset}>
                <RotateCcw className="size-4" />
                Try again
              </Button>
            )}
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {selected === null && !submitted
                ? "Select an option to continue"
                : null}
            </span>
          </div>
        </Card>
      </div>
    </Section>
  );
}
