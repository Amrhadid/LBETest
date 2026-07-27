"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { setUserRole } from "@/app/admin/actions";
import type { Role } from "@/lib/supabase/types";

const ROLES: Role[] = ["candidate", "teacher", "admin"];

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [value, setValue] = React.useState<Role>(role);
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);

  const change = (next: Role) => {
    const prev = value;
    setValue(next);
    setMsg(null);
    start(async () => {
      const res = await setUserRole(userId, next);
      if (res.error) {
        setValue(prev);
        setMsg(res.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value as Role)}
        className="h-9 rounded-lg border border-gold/30 bg-card px-2 text-sm"
      >
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {msg && <span className="text-xs text-rose-700">{msg}</span>}
    </div>
  );
}
