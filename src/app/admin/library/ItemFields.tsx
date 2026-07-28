"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isMcqType, isTermType, hasRubricType, type ItemDraft } from "@/app/admin/library/item-draft";

export const QUESTION_TYPES = [
  [1, "1 — Choose the correct answer (MCQ)"],
  [2, "2 — Choose the wrong answer (MCQ)"],
  [3, "3 — Respond to a situation (spoken)"],
  [4, "4 — Name the term"],
  [5, "5 — Write the definition"],
  [6, "6 — Speaking question about the source"],
] as const;

export const SOURCE_TYPES = ["", "email", "dialogue", "mini_article", "memo", "script", "situation", "audio", "article"];

const label = "mb-1 block text-sm text-muted-foreground";
const field = "h-11 w-full rounded-lg border border-gold/30 bg-card px-3 text-sm";

/**
 * The type-specific editable fields for one item — shared by the single-item
 * form and the bulk "Add section" form. Controlled: the parent owns the draft
 * and applies patches. (Level and the audio "Generate audio" button are the
 * container's responsibility — audio needs a saved item id.)
 */
export function ItemFields({
  draft,
  onChange,
}: {
  draft: ItemDraft;
  onChange: (patch: Partial<ItemDraft>) => void;
}) {
  const t = Number(draft.question_type);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={label}>Question type</span>
          <select value={draft.question_type} onChange={(e) => onChange({ question_type: e.target.value })} className={field}>
            {QUESTION_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>Source type</span>
          <select value={draft.source_type} onChange={(e) => onChange({ source_type: e.target.value })} className={field}>
            {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s || "(none)"}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={label}>Prompt / question shown to the candidate</span>
        <textarea value={draft.prompt} onChange={(e) => onChange({ prompt: e.target.value })} rows={3}
          className="w-full rounded-lg border border-gold/30 bg-card p-3 text-sm" />
      </label>

      <label className="block sm:max-w-md">
        <span className={label}>Media URL (image, optional)</span>
        <Input value={draft.media_url} onChange={(e) => onChange({ media_url: e.target.value })} placeholder="https://…" />
      </label>

      {isMcqType(t) && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-charcoal">
            Options {t === 2 ? "(candidate must pick the WRONG one)" : "(candidate picks the correct one)"}
          </p>
          <div className="space-y-2">
            {draft.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" checked={draft.correctId === o.id} onChange={() => onChange({ correctId: o.id })} title="Mark as the answer" />
                <Input value={o.id} placeholder="id" className="w-20"
                  onChange={(e) => onChange({ options: draft.options.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)) })} />
                <Input value={o.text} placeholder="Option text"
                  onChange={(e) => onChange({ options: draft.options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ options: draft.options.filter((_, j) => j !== i) })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2"
            onClick={() => onChange({ options: [...draft.options, { id: "", text: "" }] })}>
            <Plus className="size-4" /> Add option
          </Button>
        </div>
      )}

      {isTermType(t) && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-charcoal">Accepted terms</p>
          <div className="space-y-2">
            {draft.terms.map((term, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={term} placeholder="e.g. invoice"
                  onChange={(e) => onChange({ terms: draft.terms.map((x, j) => (j === i ? e.target.value : x)) })} />
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ terms: draft.terms.filter((_, j) => j !== i) })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onChange({ terms: [...draft.terms, ""] })}>
            <Plus className="size-4" /> Add term
          </Button>
        </div>
      )}

      {hasRubricType(t) && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-charcoal">Grading rubric (AI + human review)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={label}>Max score</span>
              <Input type="number" min={1} value={draft.maxScore} onChange={(e) => onChange({ maxScore: e.target.value })} />
            </label>
            <label>
              <span className={label}>Pass threshold (0–1)</span>
              <Input type="number" min={0} max={1} step="0.05" value={draft.passThreshold} onChange={(e) => onChange({ passThreshold: e.target.value })} />
            </label>
          </div>
          <p className="mb-2 mt-4 text-sm font-medium text-charcoal">Criteria</p>
          <div className="space-y-2">
            {draft.criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={c.id} placeholder="id" className="w-28"
                  onChange={(e) => onChange({ criteria: draft.criteria.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)) })} />
                <Input value={c.description} placeholder="what the grader checks"
                  onChange={(e) => onChange({ criteria: draft.criteria.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} />
                <Input type="number" value={c.weight} className="w-20"
                  onChange={(e) => onChange({ criteria: draft.criteria.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)) })} />
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ criteria: draft.criteria.filter((_, j) => j !== i) })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2"
            onClick={() => onChange({ criteria: [...draft.criteria, { id: "", description: "", weight: "1" }] })}>
            <Plus className="size-4" /> Add criterion
          </Button>
          <label className="mt-4 block">
            <span className={label}>Model answer (optional)</span>
            <textarea value={draft.modelAnswer} onChange={(e) => onChange({ modelAnswer: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gold/30 bg-card p-3 text-sm" />
          </label>
          <label className="mt-3 block">
            <span className={label}>Grader guidance (optional)</span>
            <textarea value={draft.guidance} onChange={(e) => onChange({ guidance: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gold/30 bg-card p-3 text-sm" />
          </label>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.active} onChange={(e) => onChange({ active: e.target.checked })} />
        Active (included in the live exam)
      </label>
    </div>
  );
}
