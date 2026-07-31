"use client";

import * as React from "react";
import {
  Check,
  X,
  Loader2,
  CircleCheck,
  CircleX,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decideGrade, gradeManually, regrade } from "@/app/admin/review/actions";

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
  failed: boolean;
  errorMessage: string | null;
}

/** Manual scoring form shown when AI grading failed (or for an override). */
function ManualGradeForm({
  grade,
  onDone,
}: {
  grade: PendingGrade;
  onDone?: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [score, setScore] = React.useState("");
  const [pass, setPass] = React.useState(true);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const res = await gradeManually(
        grade.responseId,
        Number(score),
        pass,
        grade.attemptId,
      );
      if (res.error) setError(res.error);
      else {
        setDone(true);
        onDone?.();
      }
    });

  if (done) {
    return (
      <p className="text-sm font-medium text-charcoal">
        Graded manually — {score}/{grade.maxScore}, {pass ? "pass" : "fail"}.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-charcoal/70">Score</span>
        <Input
          type="number"
          min={0}
          max={grade.maxScore}
          step="0.5"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="w-24"
          placeholder={`0–${grade.maxScore}`}
        />
      </label>
      <div className="flex overflow-hidden rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setPass(true)}
          className={
            "px-3 py-2 text-sm " +
            (pass ? "bg-emerald-600 text-white" : "text-charcoal/70")
          }
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => setPass(false)}
          className={
            "px-3 py-2 text-sm " +
            (!pass ? "bg-rose-600 text-white" : "text-charcoal/70")
          }
        >
          Fail
        </button>
      </div>
      <Button type="button" size="md" onClick={submit} disabled={pending || score === ""}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save grade
      </Button>
      {error && <span className="text-sm text-rose-700">{error}</span>}
    </div>
  );
}

function ProposalRow({ grade: initialGrade }: { grade: PendingGrade }) {
  // Local copy so a regrade can refresh the card in place (no page reload).
  const [grade, setGrade] = React.useState(initialGrade);
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<
    { decision: "approve" | "reject"; error?: string } | null
  >(null);

  // Regrade state, plus a "resolved" latch that hides Regrade once this response
  // has been human-approved or manually graded in-session (approved results must
  // not silently change — that's the manual-override flow's job).
  const [regrading, startRegrade] = React.useTransition();
  const [regradeError, setRegradeError] = React.useState<string | null>(null);
  const [resolved, setResolved] = React.useState(false);

  const decide = (decision: "approve" | "reject") =>
    startTransition(async () => {
      const res = await decideGrade(grade.responseId, decision, grade.attemptId);
      setResult({ decision, error: res.error });
      if (decision === "approve" && !res.error) setResolved(true);
    });

  const onRegrade = () =>
    startRegrade(async () => {
      setRegradeError(null);
      const res = await regrade(grade.responseId, grade.attemptId);
      if (res.error || !res.outcome) {
        setRegradeError(res.error ?? "Could not regrade.");
        return;
      }
      const o = res.outcome;
      setGrade((g) => ({
        ...g,
        failed: o.status === "failed",
        errorMessage: o.errorMessage,
        aiScore: o.aiScore,
        aiIsCorrect: o.aiIsCorrect,
        aiConfidence: o.aiConfidence,
        feedback: o.feedback,
        criteria: o.criteria,
        candidateText: g.isVoice
          ? (o.transcript ?? g.candidateText)
          : g.candidateText,
      }));
      // The new proposal is un-decided — clear any prior approve/reject result.
      setResult(null);
    });

  const decided = result && !result.error;

  // Regrade re-runs AI grading for this one response. Hidden once resolved
  // (approved / manually graded) so approved results never silently change.
  const regradeButton = resolved ? null : (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={onRegrade}
        disabled={regrading}
      >
        {regrading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Regrade
      </Button>
      {regradeError && (
        <span className="text-sm text-rose-700">{regradeError}</span>
      )}
    </div>
  );

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

        {/* Failed AI grading → manual grade. Answer + audio above stay usable. */}
        {grade.failed ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              AI grading failed — grade this by hand
            </p>
            {grade.errorMessage && (
              <p className="mt-1 text-xs text-amber-700">{grade.errorMessage}</p>
            )}
            <div className="mt-3">
              <ManualGradeForm grade={grade} onDone={() => setResolved(true)} />
            </div>
            {regradeButton && (
              <div className="mt-3 border-t border-amber-200 pt-3">
                <p className="mb-2 text-xs text-amber-700">
                  Fixed the underlying issue? Re-run AI grading instead of
                  grading by hand.
                </p>
                {regradeButton}
              </div>
            )}
          </div>
        ) : (
          <>
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
            {regradeButton}
            {result?.error && (
              <span className="text-sm text-rose-700">{result.error}</span>
            )}
          </div>
        )}
          </>
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
