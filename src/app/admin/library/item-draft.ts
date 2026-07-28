/**
 * Shared item-editing model used by BOTH the single-item form and the bulk
 * "Add section" form, so the type-specific field logic lives in one place.
 *
 * An `ItemDraft` is the editable form state for one item (level is supplied by
 * the container). `validateDraft` / `draftToInput` turn it into the ItemInput
 * the save actions expect. The JSON-paste path reuses the same output shape.
 */

import type { ItemInput } from "@/app/admin/actions";

export interface ItemDraft {
  question_type: string;
  source_type: string; // "" = none
  prompt: string;
  media_url: string;
  options: { id: string; text: string }[];
  correctId: string;
  terms: string[];
  maxScore: string;
  passThreshold: string;
  modelAnswer: string;
  guidance: string;
  criteria: { id: string; description: string; weight: string }[];
  active: boolean;
}

export const isMcqType = (t: number) => t === 1 || t === 2;
export const isTermType = (t: number) => t === 4;
export const hasRubricType = (t: number) => t === 3 || t === 4 || t === 5 || t === 6;

export function emptyDraft(): ItemDraft {
  return {
    question_type: "1",
    source_type: "",
    prompt: "",
    media_url: "",
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    correctId: "a",
    terms: [""],
    maxScore: "1",
    passThreshold: "0.6",
    modelAnswer: "",
    guidance: "",
    criteria: [{ id: "accuracy", description: "", weight: "1" }],
    active: true,
  };
}

/** Build a draft from an existing item row (single-item edit). */
export function draftFromItem(item: {
  question_type: number | null;
  source_type: string | null;
  prompt: string | null;
  media_url?: string | null;
  options: unknown;
  answer_key: unknown;
  rubric: unknown;
  active: boolean;
}): ItemDraft {
  const base = emptyDraft();
  base.question_type = String(item.question_type ?? 1);
  base.source_type = item.source_type ?? "";
  base.prompt = item.prompt ?? "";
  base.media_url = item.media_url ?? "";
  base.active = item.active;

  if (Array.isArray(item.options)) {
    base.options = (item.options as { id?: unknown; text?: unknown }[]).map((o) => ({
      id: String(o.id ?? ""),
      text: String(o.text ?? ""),
    }));
  }
  const ak = item.answer_key as Record<string, unknown> | null;
  if (ak && typeof ak === "object" && "correct" in ak) base.correctId = String(ak.correct);
  else base.correctId = base.options[0]?.id ?? "a";
  if (ak && typeof ak === "object" && Array.isArray(ak.accept)) {
    base.terms = (ak.accept as unknown[]).map(String);
  }
  const r = (item.rubric ?? null) as Record<string, unknown> | null;
  if (r && typeof r === "object") {
    if (r.max_score != null) base.maxScore = String(r.max_score);
    if (r.pass_threshold != null) base.passThreshold = String(r.pass_threshold);
    if (typeof r.model_answer === "string") base.modelAnswer = r.model_answer;
    if (typeof r.guidance === "string") base.guidance = r.guidance;
    if (Array.isArray(r.criteria)) {
      base.criteria = (r.criteria as { id?: unknown; description?: unknown; weight?: unknown }[]).map(
        (c) => ({ id: String(c.id ?? ""), description: String(c.description ?? ""), weight: String(c.weight ?? 1) }),
      );
    }
  }
  return base;
}

/** Validate one draft. Returns an error string, or null if valid. */
export function validateDraft(draft: ItemDraft): string | null {
  const t = Number(draft.question_type);
  if (!Number.isInteger(t) || t < 1 || t > 6) return "Invalid question type.";
  if (!draft.prompt.trim()) return "Prompt is required.";

  if (isMcqType(t)) {
    const cleaned = draft.options.filter((o) => o.id.trim() && o.text.trim());
    if (cleaned.length < 2) return "Add at least two options.";
    if (!cleaned.some((o) => o.id === draft.correctId)) return "Mark which option is the answer.";
  }
  if (isTermType(t)) {
    if (draft.terms.every((x) => !x.trim())) return "Add at least one accepted term.";
  }
  if (hasRubricType(t)) {
    const max = Number(draft.maxScore);
    if (!Number.isFinite(max) || max <= 0) return "Rubric max score must be a positive number.";
    const pt = Number(draft.passThreshold);
    if (!Number.isFinite(pt) || pt < 0 || pt > 1) return "Rubric pass threshold must be between 0 and 1.";
  }
  return null;
}

/** Convert a valid draft into the ItemInput the save actions consume. */
export function draftToInput(draft: ItemDraft, examId: string, lbeLevel: number): ItemInput {
  const t = Number(draft.question_type);
  let options: unknown = null;
  let answer_key: unknown = null;
  let rubric: unknown = null;

  if (isMcqType(t)) {
    options = draft.options.filter((o) => o.id.trim() && o.text.trim());
    answer_key = { correct: draft.correctId };
  }
  if (isTermType(t)) {
    answer_key = { accept: draft.terms.map((x) => x.trim()).filter(Boolean) };
  }
  if (hasRubricType(t)) {
    rubric = {
      version: 1,
      max_score: Number(draft.maxScore) || 1,
      pass_threshold: Number(draft.passThreshold) || 0.6,
      criteria: draft.criteria
        .filter((c) => c.id.trim() && c.description.trim())
        .map((c) => ({ id: c.id.trim(), description: c.description.trim(), weight: Number(c.weight) || 1 })),
      ...(draft.modelAnswer.trim() ? { model_answer: draft.modelAnswer.trim() } : {}),
      ...(draft.guidance.trim() ? { guidance: draft.guidance.trim() } : {}),
    };
  }

  return {
    exam_id: examId,
    lbe_level: lbeLevel,
    question_type: t,
    source_type: draft.source_type || null,
    prompt: draft.prompt.trim() || null,
    media_url: draft.media_url.trim() || null,
    options,
    answer_key,
    rubric,
    active: draft.active,
  };
}

// ---------------------------------------------------------------------------
// JSON-paste path — validate a raw item object and convert to ItemInput.
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

/** Validate + convert one pasted JSON item object. Level comes from context. */
export function jsonItemToInput(
  raw: unknown,
  examId: string,
  lbeLevel: number,
  index: number,
): { input?: ItemInput; error?: string } {
  const label = `Item ${index + 1}`;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: `${label}: must be an object.` };
  }
  const o = raw as Json;
  const t = Number(o.question_type);
  if (!Number.isInteger(t) || t < 1 || t > 6) {
    return { error: `${label}: question_type must be 1–6.` };
  }
  const prompt = typeof o.prompt === "string" ? o.prompt : "";
  if (!prompt.trim()) return { error: `${label}: prompt is required.` };

  const source_type = o.source_type == null ? null : String(o.source_type);
  let options: unknown = null;
  let answer_key: unknown = null;
  let rubric: unknown = null;

  if (isMcqType(t)) {
    if (!Array.isArray(o.options) || o.options.length < 2) {
      return { error: `${label}: MCQ needs an options array with at least 2 entries.` };
    }
    const opts = o.options as { id?: unknown; text?: unknown }[];
    if (!opts.every((op) => op && typeof op.id !== "undefined" && typeof op.text === "string")) {
      return { error: `${label}: each option needs {id, text}.` };
    }
    const correct = (o.answer_key as Json | null)?.correct;
    if (correct == null || !opts.some((op) => String(op.id) === String(correct))) {
      return { error: `${label}: answer_key.correct must match one option id.` };
    }
    options = opts.map((op) => ({ id: String(op.id), text: String(op.text) }));
    answer_key = { correct: String(correct) };
  }
  if (isTermType(t)) {
    const accept = (o.answer_key as Json | null)?.accept;
    if (!Array.isArray(accept) || accept.length === 0) {
      return { error: `${label}: type 4 needs answer_key.accept (non-empty array).` };
    }
    answer_key = { accept: accept.map(String) };
  }
  if (hasRubricType(t)) {
    const r = o.rubric as Json | null;
    if (!r || typeof r !== "object" || Array.isArray(r)) {
      return { error: `${label}: type ${t} needs a rubric object.` };
    }
    const max = Number(r.max_score);
    if (!Number.isFinite(max) || max <= 0) {
      return { error: `${label}: rubric.max_score must be a positive number.` };
    }
    rubric = r;
  }

  return {
    input: {
      exam_id: examId,
      lbe_level: lbeLevel,
      question_type: t,
      source_type,
      prompt,
      media_url: o.media_url == null ? null : String(o.media_url),
      options,
      answer_key,
      rubric,
      active: o.active === undefined ? true : Boolean(o.active),
    },
  };
}

/** Parse + validate a pasted JSON array into ItemInputs (all-or-nothing). */
export function parseBulkJson(
  text: string,
  examId: string,
  lbeLevel: number,
  expectedCount: number,
): { inputs?: ItemInput[]; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { error: `Not valid JSON: ${e instanceof Error ? e.message : "parse error"}` };
  }
  if (!Array.isArray(parsed)) return { error: "Expected a JSON array of item objects." };
  if (parsed.length !== expectedCount) {
    return { error: `Expected ${expectedCount} items, got ${parsed.length}.` };
  }
  const inputs: ItemInput[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const { input, error } = jsonItemToInput(parsed[i], examId, lbeLevel, i);
    if (error) return { error };
    inputs.push(input!);
  }
  return { inputs };
}
