"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setItemActive, deleteItem } from "@/app/admin/actions";

export function ItemRowActions({
  id,
  active,
  examId,
}: {
  id: string;
  active: boolean;
  examId: string;
}) {
  const [pending, start] = React.useTransition();
  const [err, setErr] = React.useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      {err && <span className="mr-2 text-xs text-rose-700">{err}</span>}
      <Link href={`/admin/library/${id}?exam=${examId}`}>
        <Button type="button" variant="ghost" size="sm"><Pencil className="size-4" /></Button>
      </Link>
      <Button
        type="button" variant="ghost" size="sm" disabled={pending}
        onClick={() => start(async () => { await setItemActive(id, !active); })}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : active ? "Deactivate" : "Activate"}
      </Button>
      <Button
        type="button" variant="ghost" size="sm" disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const res = await deleteItem(id);
            if (res.error) setErr(res.error);
          })
        }
      >
        Delete
      </Button>
    </div>
  );
}
