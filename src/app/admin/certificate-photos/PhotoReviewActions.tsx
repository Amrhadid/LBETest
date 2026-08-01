"use client";

import * as React from "react";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setCertificatePhotoStatus } from "@/app/admin/actions";

/** Approve / reject a candidate's certificate photo. */
export function PhotoReviewActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const [pending, start] = React.useTransition();

  const decide = (decision: "approved" | "rejected") =>
    start(async () => {
      await setCertificatePhotoStatus(userId, decision);
    });

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="gold"
        size="sm"
        disabled={pending || status === "approved"}
        onClick={() => decide("approved")}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Approve
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
    </div>
  );
}
