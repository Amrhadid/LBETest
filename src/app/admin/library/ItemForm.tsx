"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveItem, generateItemAudio, type ItemInput } from "@/app/admin/actions";

const QUESTION_TYPES = [
  [1, "1 — Choose the correct answer (MCQ)"],
  [2, "2 — Choose the wrong answer (MCQ)"],
  [3, "3 — Respond to a situation (spoken)"],
  [4, "4 — Name the term"],
  [5, "5 — Write the definition"],
  [6, "6 — Speaking question about the source"],
] as const;

const SOURCE_TYPES = ["", "email", "dialogue", "mini_article", "memo", "script", "situation", "audio", "article"];

type Opt = { id: string; text: string };
type Crit = { id: string; description: string; weight: string };

interface ItemData {
  id: string;
  lbe_level: number | null;
  question_type: number | null;
  source_type: string | null;
  prompt: string | null;
  media_url?: string | null;
  options: unknown;
  answer_key: unknown;
  rubric: unknown;
  active: boolean;
}

const label = "mb-1 block text-sm text-muted-foreground";
const field = "h-11 w-full rounded-lg border border-gold/30 bg-card px-3 text-sm";

export function ItemForm({ examId, item }: { examId: string; item?: ItemData }) {
  const router = useRouter();
  const [level, setLevel] = React.useState(String(item?.lbe_level ?? 1));
  const [qtype, setQtype] = React.useState(String(item?.question_type ?? 1));
  const [source, setSource] = React.useState(item?.source_type ?? "");
  const [prompt, setPrompt] = React.useState(item?.prompt ?? "");
  const [mediaUrl, setMediaUrl] = React.useState(item?.media_url ?? "");
  const [active, setActive] = React.useState(item?.active ?? true);

  // MCQ options + correct answer (types 1/2).
  const initialOpts: Opt[] = Array.isArray(item?.options)
    ? (item!.options as Opt[]).map((o) => ({ id: String(o.id ?? ""), text: String(o.text ?? "") }))
    : [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }];
  const [opts, setOpts] = React.useState<Opt[]>(initialOpts);
  const initialCorrect =
    item?.answer_key && typeof item.answer_key === "object" && "correct" in (item.answer_key as object)
      ? String((item.answer_key as { correct: unknown }).correct)
      : initialOpts[0]?.id ?? "a";
  const [correctId, setCorrectId] = React.useState(initialCorrect);

  // Accepted terms (type 4).
  const initialTerms: string[] =
    item?.answer_key && typeof item.answer_key === "object" && "accept" in (item.answer_key as object)
      ? ((item.answer_key as { accept: unknown }).accept as string[]).map(String)
      : [""];
  const [terms, setTerms] = React.useState<string[]>(initialTerms);

  // Rubric (AI-graded types 3/4/5/6).
  const r = (item?.rubric ?? {}) as {
    max_score?: number; pass_threshold?: number; model_answer?: string; guidance?: string;
    criteria?: { id: string; description: string; weight?: number }[];
  };
  const [maxScore, setMaxScore] = React.useState(String(r.max_score ?? 1));
  const [passThreshold, setPassThreshold] = React.useState(String(r.pass_threshold ?? 0.6));
  const [modelAnswer, setModelAnswer] = React.useState(r.model_answer ?? "");
  const [guidance, setGuidance] = React.useState(r.guidance ?? "");
  const [criteria, setCriteria] = React.useState<Crit[]>(
    (r.criteria ?? [{ id: "accuracy", description: "", weight: 1 }]).map((c) => ({
      id: c.id, description: c.description, weight: String(c.weight ?? 1),
    })),
  );

  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Audio generation (audio-source items only).
  const [audioPending, startAudio] = React.useTransition();
  const [audioMsg, setAudioMsg] = React.useState<string | null>(null);
  const generateAudio = () =>
    startAudio(async () => {
      setAudioMsg(null);
      if (!item?.id) return;
      const res = await generateItemAudio(item.id, prompt);
      if (res.error) setAudioMsg(res.error);
      else {
        if (res.url) setMediaUrl(res.url);
        setAudioMsg("Audio generated and saved.");
      }
    });

  const t = Number(qtype);
  const isMcq = t === 1 || t === 2;
  const isTerm = t === 4;
  const hasRubric = t === 3 || t === 4 || t === 5 || t === 6;

  const submit = () =>
    start(async () => {
      setError(null);
      let options: unknown = null;
      let answerKey: unknown = null;
      let rubric: unknown = null;

      if (isMcq) {
        const cleaned = opts.filter((o) => o.id.trim() && o.text.trim());
        if (cleaned.length < 2) { setError("Add at least two options."); return; }
        if (!cleaned.some((o) => o.id === correctId)) { setError("Pick which option is the answer."); return; }
        options = cleaned;
        answerKey = { correct: correctId };
      }
      if (isTerm) {
        const cleaned = terms.map((x) => x.trim()).filter(Boolean);
        if (cleaned.length === 0) { setError("Add at least one accepted term."); return; }
        answerKey = { accept: cleaned };
      }
      if (hasRubric) {
        rubric = {
          version: 1,
          max_score: Number(maxScore) || 1,
          pass_threshold: Number(passThreshold) || 0.6,
          criteria: criteria
            .filter((c) => c.id.trim() && c.description.trim())
            .map((c) => ({ id: c.id.trim(), description: c.description.trim(), weight: Number(c.weight) || 1 })),
          ...(modelAnswer.trim() ? { model_answer: modelAnswer.trim() } : {}),
          ...(guidance.trim() ? { guidance: guidance.trim() } : {}),
        };
      }

      const payload: ItemInput = {
        id: item?.id,
        exam_id: examId,
        lbe_level: Number(level),
        question_type: t,
        source_type: source || null,
        prompt: prompt || null,
        media_url: mediaUrl || null,
        options,
        answer_key: answerKey,
        rubric,
        active,
      };
      const res = await saveItem(payload);
      if (res.error) setError(res.error);
      else router.push(`/admin/library?exam=${examId}`);
    });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className={label}>Section (LBE level)</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={field}>
            {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Section {l}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={label}>Question type</span>
          <select value={qtype} onChange={(e) => setQtype(e.target.value)} className={field}>
            {QUESTION_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={label}>Source type</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={field}>
            {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s || "(none)"}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>Media URL (audio/image, optional)</span>
          <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
        </label>
      </div>

      {source === "audio" && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-1 text-sm font-semibold text-charcoal">Listening audio</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Type the listening script in the <strong>Prompt</strong> field above,
            then generate the audio once. Candidates stream the saved file — Google
            TTS is <strong>not</strong> called again per attempt. Regenerating
            overwrites the stored file.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={generateAudio}
              disabled={audioPending || !item?.id}
            >
              {audioPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Volume2 className="size-4" />
              )}
              {mediaUrl ? "Regenerate audio" : "Generate audio"}
            </Button>
            {!item?.id && (
              <span className="text-xs text-muted-foreground">
                Save the item first, then generate its audio.
              </span>
            )}
            {audioMsg && <span className="text-xs text-muted-foreground">{audioMsg}</span>}
          </div>
          {mediaUrl && (
            <audio controls src={mediaUrl} className="mt-3 h-9 w-full max-w-md" />
          )}
        </div>
      )}

      <label className="block">
        <span className={label}>Prompt / question shown to the candidate</span>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full rounded-lg border border-gold/30 bg-card p-3 text-sm" />
      </label>

      {isMcq && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-charcoal">
            Options {t === 2 ? "(candidate must pick the WRONG one)" : "(candidate picks the correct one)"}
          </p>
          <div className="space-y-2">
            {opts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio" name="correct" checked={correctId === o.id}
                  onChange={() => setCorrectId(o.id)} title="Mark as the answer"
                />
                <Input
                  value={o.id} placeholder="id"
                  onChange={(e) => setOpts((p) => p.map((x, j) => j === i ? { ...x, id: e.target.value } : x))}
                  className="w-20"
                />
                <Input
                  value={o.text} placeholder="Option text"
                  onChange={(e) => setOpts((p) => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpts((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2"
            onClick={() => setOpts((p) => [...p, { id: "", text: "" }])}>
            <Plus className="size-4" /> Add option
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            The radio marks the {t === 2 ? "wrong" : "correct"} option (stored as the answer key).
          </p>
        </div>
      )}

      {isTerm && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-charcoal">Accepted terms</p>
          <div className="space-y-2">
            {terms.map((term, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={term} placeholder="e.g. invoice"
                  onChange={(e) => setTerms((p) => p.map((x, j) => j === i ? e.target.value : x))} />
                <Button type="button" variant="ghost" size="sm" onClick={() => setTerms((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setTerms((p) => [...p, ""])}>
            <Plus className="size-4" /> Add term
          </Button>
        </div>
      )}

      {hasRubric && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-charcoal">Grading rubric (AI + human review)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={label}>Max score</span>
              <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
            </label>
            <label>
              <span className={label}>Pass threshold (0–1)</span>
              <Input type="number" min={0} max={1} step="0.05" value={passThreshold} onChange={(e) => setPassThreshold(e.target.value)} />
            </label>
          </div>
          <p className="mb-2 mt-4 text-sm font-medium text-charcoal">Criteria</p>
          <div className="space-y-2">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={c.id} placeholder="id" className="w-28"
                  onChange={(e) => setCriteria((p) => p.map((x, j) => j === i ? { ...x, id: e.target.value } : x))} />
                <Input value={c.description} placeholder="what the grader checks"
                  onChange={(e) => setCriteria((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                <Input type="number" value={c.weight} className="w-20"
                  onChange={(e) => setCriteria((p) => p.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))} />
                <Button type="button" variant="ghost" size="sm" onClick={() => setCriteria((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2"
            onClick={() => setCriteria((p) => [...p, { id: "", description: "", weight: "1" }])}>
            <Plus className="size-4" /> Add criterion
          </Button>
          <label className="mt-4 block">
            <span className={label}>Model answer (optional)</span>
            <textarea value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} rows={2} className="w-full rounded-lg border border-gold/30 bg-card p-3 text-sm" />
          </label>
          <label className="mt-3 block">
            <span className={label}>Grader guidance (optional)</span>
            <textarea value={guidance} onChange={(e) => setGuidance(e.target.value)} rows={2} className="w-full rounded-lg border border-gold/30 bg-card p-3 text-sm" />
          </label>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (included in the live exam)
      </label>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save item
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`/admin/library?exam=${examId}`)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
