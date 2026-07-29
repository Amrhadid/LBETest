"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recomputeTrust } from "@/app/admin/actions";

/** Admin button to recompute + store an attempt's suspicion score on demand. */
export function RecomputeTrustButton({ attemptId }: { attemptId: string }) {
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<string>("");

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await recomputeTrust(attemptId);
            setMsg(res.error ?? res.message ?? "");
          })
        }
      >
        <RefreshCw className={"size-4" + (pending ? " animate-spin" : "")} />
        Recompute
      </Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </span>
  );
}
