"use client";

import * as React from "react";
import { ShieldCheck, ShieldAlert, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { reviewAttempt } from "@/app/admin/actions";

/**
 * Human-review controls for a flagged attempt (#8). Admin marks the attempt
 * "Cleared" or "Confirmed Violation" with an optional note; the decision,
 * reviewer, and timestamp are stored and audit-logged.
 */
export function ReviewControls({
  attemptId,
  current,
  note: initialNote,
  reviewer,
  reviewedAt,
}: {
  attemptId: string;
  current: string | null;
  note: string | null;
  reviewer: string | null;
  reviewedAt: string | null;
}) {
  const [note, setNote] = React.useState(initialNote ?? "");
  const [status, setStatus] = React.useState(current);
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState("");

  const decide = (decision: "cleared" | "confirmed_violation") =>
    startTransition(async () => {
      const res = await reviewAttempt(attemptId, decision, note);
      setMsg(res.error ?? res.message ?? "");
      if (!res.error) setStatus(decision);
    });

  return (
    <div className="mt-5 rounded-lg border border-gold/20 bg-white/60 p-4">
      <p className="text-sm font-medium text-charcoal">Human review</p>
      {status && (
        <p className="mt-1 text-xs text-muted-foreground">
          Current:{" "}
          <span className={status === "cleared" ? "text-emerald-700" : "text-red-700"}>
            {status === "cleared" ? "Cleared" : "Confirmed violation"}
          </span>
          {reviewer ? ` · by ${reviewer}` : ""}
          {reviewedAt ? ` · ${reviewedAt.slice(0, 16).replace("T", " ")}` : ""}
        </p>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (what you saw, decision rationale)…"
        rows={2}
        className="mt-3 w-full rounded-md border border-gold/25 bg-background p-2 text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => decide("cleared")}>
          <ShieldCheck className="size-4 text-emerald-700" /> Reviewed: Cleared
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => decide("confirmed_violation")}>
          <ShieldAlert className="size-4 text-red-700" /> Reviewed: Confirmed violation
        </Button>
        {msg && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3" /> {msg}
          </span>
        )}
      </div>
    </div>
  );
}
