"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setCertificateStatus } from "@/app/admin/actions";

export function CertActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, start] = React.useTransition();
  const revoked = status === "revoked";

  return (
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
  );
}
