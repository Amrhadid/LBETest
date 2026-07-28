"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ClipboardPaste, Rows3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { saveItemsBulk } from "@/app/admin/actions";
import type { ItemInput } from "@/app/admin/actions";
import {
  emptyDraft, validateDraft, draftToInput, parseBulkJson, type ItemDraft,
} from "@/app/admin/library/item-draft";
import { ItemFields, QUESTION_TYPES } from "@/app/admin/library/ItemFields";

const COUNT = 10; // one section

const typeLabel = (t: number) =>
  (QUESTION_TYPES.find(([v]) => v === t)?.[1] as string) ?? `Type ${t}`;

export function BulkForm({
  examId,
  level,
  existingCount,
}: {
  examId: string;
  level: number;
  existingCount: number;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"form" | "json">("form");
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // --- Repeated-form mode ---
  const [drafts, setDrafts] = React.useState<ItemDraft[]>(() =>
    Array.from({ length: COUNT }, () => emptyDraft()),
  );
  const patch = (i: number, p: Partial<ItemDraft>) =>
    setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...p } : d)));

  // --- JSON mode ---
  const [json, setJson] = React.useState("");
  const [preview, setPreview] = React.useState<ItemInput[] | null>(null);

  const saveForm = () =>
    start(async () => {
      setError(null);
      for (let i = 0; i < drafts.length; i++) {
        const err = validateDraft(drafts[i]);
        if (err) { setError(`Item ${i + 1}: ${err}`); return; }
      }
      const inputs = drafts.map((d) => draftToInput(d, examId, level));
      const res = await saveItemsBulk(inputs);
      if (res.error) setError(res.error);
      else router.push(`/admin/library?exam=${examId}`);
    });

  const validateJson = () => {
    setError(null);
    setPreview(null);
    const { inputs, error: e } = parseBulkJson(json, examId, level, COUNT);
    if (e) { setError(e); return; }
    setPreview(inputs!);
  };

  const saveJson = () =>
    start(async () => {
      if (!preview) return;
      setError(null);
      const res = await saveItemsBulk(preview);
      if (res.error) setError(res.error);
      else router.push(`/admin/library?exam=${examId}`);
    });

  return (
    <div>
      {existingCount > 0 && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Section {level} already has {existingCount} active item{existingCount === 1 ? "" : "s"}.
          Bulk-add appends {COUNT} more — deactivate the old ones in the library if you&apos;re replacing them.
        </p>
      )}

      <div className="mb-6 inline-flex rounded-lg border border-gold/25 p-1">
        <button onClick={() => setMode("form")}
          className={"inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm " + (mode === "form" ? "bg-gold/15 font-medium text-charcoal" : "text-muted-foreground")}>
          <Rows3 className="size-4" /> Repeated form
        </button>
        <button onClick={() => setMode("json")}
          className={"inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm " + (mode === "json" ? "bg-gold/15 font-medium text-charcoal" : "text-muted-foreground")}>
          <ClipboardPaste className="size-4" /> Paste JSON
        </button>
      </div>

      {mode === "form" ? (
        <div className="space-y-6">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-2xl border border-gold/20 bg-card/60 p-5">
              <p className="mb-3 font-serif-display text-lg text-charcoal">Item {i + 1}</p>
              <ItemFields draft={d} onChange={(p) => patch(i, p)} />
            </div>
          ))}
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" onClick={saveForm} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />} Save all {COUNT} items
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push(`/admin/library?exam=${examId}`)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste a JSON array of exactly {COUNT} item objects (they&apos;ll all be added to Section {level}).
            See the format below.
          </p>
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setPreview(null); }}
            rows={16}
            spellCheck={false}
            placeholder='[ { "question_type": 1, "source_type": "email", "prompt": "…", "options": [{"id":"a","text":"…"}], "answer_key": {"correct":"a"}, "rubric": null, "active": true }, … ]'
            className="w-full rounded-lg border border-gold/30 bg-card p-3 font-mono text-xs"
          />
          {error && <p className="text-sm text-rose-700">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={validateJson}>Validate &amp; preview</Button>
            <Button type="button" onClick={saveJson} disabled={pending || !preview}>
              {pending && <Loader2 className="size-4 animate-spin" />} Save all {COUNT} items
            </Button>
          </div>

          {preview && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4">
              <p className="mb-3 text-sm font-semibold text-emerald-800">
                ✓ Valid — {preview.length} items ready for Section {level}:
              </p>
              <ol className="space-y-1 text-sm">
                {preview.map((it, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 shrink-0 text-muted-foreground">{i + 1}.</span>
                    <span className="shrink-0 text-xs text-gold">{typeLabel(it.question_type)}</span>
                    <span className="truncate text-charcoal">{it.prompt}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
