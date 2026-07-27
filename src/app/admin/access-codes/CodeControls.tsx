"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAccessCodes, revokeAccessCode } from "@/app/admin/actions";

export function GenerateCodes() {
  const [count, setCount] = React.useState("1");
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gold/15 bg-card p-4">
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">How many codes</span>
        <Input
          type="number" min={1} max={200} value={count}
          onChange={(e) => setCount(e.target.value)}
          className="w-28"
        />
      </label>
      <Button
        type="button"
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await generateAccessCodes(Number(count) || 1);
            setMsg(res.error ?? res.message ?? null);
          })
        }
        disabled={pending}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Generate
      </Button>
      {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
    </div>
  );
}

export function RevokeCode({ id }: { id: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      type="button" variant="ghost" size="sm" disabled={pending}
      onClick={() => start(async () => { await revokeAccessCode(id); })}
    >
      {pending && <Loader2 className="size-4 animate-spin" />} Revoke
    </Button>
  );
}
