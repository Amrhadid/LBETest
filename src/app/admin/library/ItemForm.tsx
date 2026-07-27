"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveItem, type ItemInput } from "@/app/admin/actions";

const QUESTION_TYPES = [
  [1, "1 — Choose the correct answer (MCQ)"],
  [2, "2 — Choose the wrong answer (MCQ)"],
  [3, "3 — Respond to a situation (spoken)"],
  [4, "4 — Name the term"],
  [5, "5 — Write the definition"],
  [6, "6 — Speaking question about the source"],
] as const;

const SOURCE_TYPES = ["", "email", "dialogue", "mini_article", "memo", "script", "situation", "audio", "article"];

function jsonField(v: unknown): string {
  return v == null ? "" : JSON.stringify(v, null, 2);
}

export function ItemForm({
  examId,
  item,
}: {
  examId: string;
  item?: {
    id: string;
    lbe_level: number | null;
    question_type: number | null;
    source_type: string | null;
    prompt: string | null;
    options: unknown;
    answer_key: unknown;
    rubric: unknown;
    active: boolean;
  };
}) {
  const router = useRouter();
  const [level, setLevel] = React.useState(String(item?.lbe_level ?? 1));
  const [qtype, setQtype] = React.useState(String(item?.question_type ?? 1));
  const [source, setSource] = React.useState(item?.source_type ?? "");
  const [prompt, setPrompt] = React.useState(item?.prompt ?? "");
  const [options, setOptions] = React.useState(jsonField(item?.options));
  const [answerKey, setAnswerKey] = React.useState(jsonField(item?.answer_key));
  const [rubric, setRubric] = React.useState(jsonField(item?.rubric));
  const [active, setActive] = React.useState(item?.active ?? true);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const parse = (label: string, raw: string): { ok: true; value: unknown } | { ok: false } => {
    if (!raw.trim()) return { ok: true, value: null };
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch {
      setError(`${label} is not valid JSON.`);
      return { ok: false };
    }
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const o = parse("Options", options);
      const a = parse("Answer key", answerKey);
      const r = parse("Rubric", rubric);
      if (!o.ok || !a.ok || !r.ok) return;

      const payload: ItemInput = {
        id: item?.id,
        exam_id: examId,
        lbe_level: Number(level),
        question_type: Number(qtype),
        source_type: source || null,
        prompt: prompt || null,
        options: o.value,
        answer_key: a.value,
        rubric: r.value,
        active,
      };
      const res = await saveItem(payload);
      if (res.error) setError(res.error);
      else router.push("/admin/library");
    });

  const ta = "w-full rounded-lg border border-gold/30 bg-card p-3 font-mono text-xs";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Section (LBE level)</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-11 w-full rounded-lg border border-gold/30 bg-card px-3 text-sm">
            {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Section {l}</option>)}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-muted-foreground">Question type</span>
          <select value={qtype} onChange={(e) => setQtype(e.target.value)} className="h-11 w-full rounded-lg border border-gold/30 bg-card px-3 text-sm">
            {QUESTION_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Source type</span>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="h-11 w-full max-w-xs rounded-lg border border-gold/30 bg-card px-3 text-sm">
          {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s || "(none)"}</option>)}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Prompt</span>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full rounded-lg border border-gold/30 bg-card p-3 text-sm" />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Options (JSON — e.g. [{`{"id":"a","text":"…"}`}])</span>
        <textarea value={options} onChange={(e) => setOptions(e.target.value)} rows={4} className={ta} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Answer key (JSON — e.g. {`{"correct":"a"}`} or {`{"accept":["term"]}`})</span>
        <textarea value={answerKey} onChange={(e) => setAnswerKey(e.target.value)} rows={3} className={ta} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Rubric (JSON — for AI-graded types 3/4/5/6)</span>
        <textarea value={rubric} onChange={(e) => setRubric(e.target.value)} rows={5} className={ta} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (included in the live exam)
      </label>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save item
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/library")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
