"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateExam } from "@/app/admin/actions";

const STATUSES = ["draft", "published", "archived"];

export function ExamEditor({
  exam,
}: {
  exam: { id: string; title: string | null; version: number | null; status: string };
}) {
  const [title, setTitle] = React.useState(exam.title ?? "");
  const [version, setVersion] = React.useState(String(exam.version ?? 1));
  const [status, setStatus] = React.useState(exam.status);
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);

  const save = () =>
    start(async () => {
      setMsg(null);
      const res = await updateExam(exam.id, {
        title,
        version: Number(version) || 1,
        status,
      });
      setMsg(res.error ?? res.message ?? null);
    });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gold/15 bg-card p-4 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm">
        <span className="mb-1 block text-muted-foreground">Title</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="text-sm sm:w-24">
        <span className="mb-1 block text-muted-foreground">Version</span>
        <Input type="number" min={1} value={version} onChange={(e) => setVersion(e.target.value)} />
      </label>
      <label className="text-sm sm:w-40">
        <span className="mb-1 block text-muted-foreground">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 w-full rounded-lg border border-gold/30 bg-card px-3 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <Button type="button" size="md" onClick={save} disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Save
      </Button>
      {msg && <span className="self-center text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}
