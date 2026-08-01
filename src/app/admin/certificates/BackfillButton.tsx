"use client";

import * as React from "react";
import { Loader2, BadgePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { backfillCertificates } from "@/app/admin/actions";

/**
 * Issues certificates for any scored attempt still missing one (every completed
 * attempt now certifies at LBE 1+). Safe to run repeatedly.
 */
export function BackfillButton() {
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="md"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await backfillCertificates();
            setMsg(res.error ?? res.message ?? null);
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <BadgePlus className="size-4" />}
        Issue missing certificates
      </Button>
      {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
    </div>
  );
}
