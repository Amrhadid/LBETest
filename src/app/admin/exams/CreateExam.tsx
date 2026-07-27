"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createExam } from "@/app/admin/actions";

export function CreateExam() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> New exam
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Code</span>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="LBE-2026" className="w-32" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Title</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" className="w-48" />
      </label>
      <Button
        size="md"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await createExam({ code, title });
            if (res.error || !res.id) setError(res.error ?? "Failed.");
            else router.push(`/admin/library?exam=${res.id}`);
          })
        }
      >
        {pending && <Loader2 className="size-4 animate-spin" />} Create
      </Button>
      <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Cancel</Button>
      {error && <span className="text-sm text-rose-700">{error}</span>}
    </div>
  );
}
