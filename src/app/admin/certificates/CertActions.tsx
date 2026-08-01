"use client";

import * as React from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setCertificateStatus, regenerateCertificate } from "@/app/admin/actions";

export function CertActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, start] = React.useTransition();
  const [regenPending, startRegen] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);
  const revoked = status === "revoked";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={regenPending}
        title="Rebuild the PDF (e.g. to apply an approved photo)"
        onClick={() =>
          startRegen(async () => {
            const res = await regenerateCertificate(id);
            setMsg(res.error ?? res.message ?? null);
          })
        }
      >
        {regenPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        Regenerate PDF
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await setCertificateStatus(id, revoked ? "valid" : "revoked");
          })
        }
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {revoked ? "Reinstate" : "Revoke"}
      </Button>
      {msg && <span className="w-full text-right text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}
