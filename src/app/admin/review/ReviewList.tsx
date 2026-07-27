"use client";

import * as React from "react";
import { Check, X, Loader2, CircleCheck, CircleX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decideGrade } from "@/app/admin/review/actions";

export interface PendingGrade {
  responseId: string;
  attemptId: string;
  questionType: number;
  questionTypeLabel: string;
  lbeLevel: number | null;
  prompt: string | null;
  isVoice: boolean;
  candidateText: string; // typed answer OR speech transcript
  audioUrl: string | null;
  aiScore: number | null;
  maxScore: number;
  aiIsCorrect: boolean | null;
  aiConfidence: number | null;
  feedback: string;
  criteria: { id: string; met: boolean; note?: string }[];
}

function ProposalRow({ grade }: { grade: PendingGrade }) {
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<
    { decision: "approve" | "reject"; error?: string } | null
  >(null);

  const decide = (decision: "approve" | "reject") =>
    startTransition(async () => {
      const res = await decideGrade(grade.responseId, decision);
      setResult({ decision, error: res.error });
    });

  const decided = result && !result.error;

  return (
    <Card className={decided ? "opacity-60" : undefined}>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-gold/15 px-2 py-0.5 font-medium text-charcoal">
            {grade.questionTypeLabel}
          </span>
          {grade.lbeLevel != null && (
            <span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-charcoal/70">
              Section {grade.lbeLevel}
            </span>
          )}
          {grade.isVoice && (
            <span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-charcoal/70">
              Voice · transcript
            </span>
          )}
        </div>
        <CardTitle className="mt-1 text-base">
          {grade.prompt ?? "(no prompt)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Candidate's original response */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
            {grade.isVoice ? "Candidate — spoken (transcript)" : "Candidate answer"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
            {grade.candidateText || (
              <span className="italic text-charcoal/40">
                {grade.isVoice ? "(no speech detected)" : "(no answer submitted)"}
              </span>
            )}
          </p>
          {grade.audioUrl && (
            <audio
              controls
              src={grade.audioUrl}
              className="mt-2 h-9 w-full max-w-md"
            />
          )}
        </div>

        {/* AI proposal */}
        <div className="rounded-xl border border-border bg-ivory/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
              AI proposal
            </p>
            <span className="text-sm font-semibold text-charcoal">
              {grade.aiScore ?? "—"} / {grade.maxScore}
            </span>
            <span
              className={
                "inline-flex items-center gap-1 text-sm " +
                (grade.aiIsCorrect
                  ? "text-emerald-700"
                  : "text-rose-700")
              }
            >
              {grade.aiIsCorrect ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <CircleX className="h-4 w-4" />
              )}
              {grade.aiIsCorrect ? "would pass" : "would fail"}
            </span>
            {grade.aiConfidence != null && (
              <span
                className={
                  "text-xs " +
                  (grade.aiConfidence < 0.6
                    ? "font-semibold text-amber-700"
                    : "text-charcoal/60")
                }
              >
                confidence {(grade.aiConfidence * 100).toFixed(0)}%
                {grade.aiConfidence < 0.6 ? " · low" : ""}
              </span>
            )}
          </div>
          {grade.feedback && (
            <p className="mt-2 text-sm text-charcoal/80">{grade.feedback}</p>
          )}
          {grade.criteria.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {grade.criteria.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  {c.met ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span className="text-charcoal/80">
                    <span className="font-medium">{c.id}</span>
                    {c.note ? ` — ${c.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-charcoal/50">
            Nothing counts toward the score or certificate until you approve.
          </p>
        </div>

        {/* Decision */}
        {decided ? (
          <p className="text-sm font-medium text-charcoal">
            {result!.decision === "approve"
              ? "Approved — promoted to the candidate's score."
              : "Rejected — not counted; grade manually if needed."}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="md"
              onClick={() => decide("approve")}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={() => decide("reject")}
              disabled={pending}
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
            {result?.error && (
              <span className="text-sm text-rose-700">{result.error}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewList({ grades }: { grades: PendingGrade[] }) {
  if (grades.length === 0) {
    return (
      <p className="text-charcoal/60">
        Nothing awaiting approval. AI-graded responses will appear here as
        candidates submit.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      {grades.map((g) => (
        <ProposalRow key={g.responseId} grade={g} />
      ))}
    </div>
  );
}
