"use client";

import * as React from "react";
import { Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startPreviewAttempt } from "@/app/admin/actions";

/** Starts a preview attempt (no access code) and enters the real exam runner. */
export function PreviewButton() {
  const [pending, start] = React.useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => start(() => startPreviewAttempt())}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
      Preview exam
    </Button>
  );
}
