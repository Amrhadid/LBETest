"use client";

import * as React from "react";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewCandidateName } from "@/app/admin/actions";

/**
 * Review a candidate's legal name: correct it inline to match their document,
 * then Approve (saves the edited name and approves it), or Reject.
 */
export function NameReviewActions({
  userId,
  status,
  name,
}: {
  userId: string;
  status: string;
  name: string;
}) {
  const [pending, start] = React.useTransition();
  const [value, setValue] = React.useState(name);
  const [msg, setMsg] = React.useState<string | null>(null);

  const edited = value.trim() !== name.trim();

  const decide = (decision: "approved" | "rejected") =>
    start(async () => {
      const res = await reviewCandidateName(userId, decision, value);
      setMsg(res.error ?? res.message ?? null);
    });

  return (
    <div className="space-y-2">
      <Input
        aria-label="Candidate name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="gold"
          size="sm"
          disabled={pending || (status === "approved" && !edited)}
          onClick={() => decide("approved")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {edited ? "Save & approve" : "Approve"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || status === "rejected"}
          onClick={() => decide("rejected")}
        >
          <X className="size-4" /> Reject
        </Button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
