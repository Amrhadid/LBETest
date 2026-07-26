/**
 * Exam-engine domain types. These mirror the `items` table shape and the
 * question-type/source-type vocabulary used across the engine components.
 */

/** Kinds of source stimulus a candidate reads or listens to. */
export const SourceType = {
  Email: "email",
  Dialogue: "dialogue",
  MiniArticle: "mini_article",
  Memo: "memo",
  Script: "script",
  Situation: "situation",
  Audio: "audio",
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export const ALL_SOURCE_TYPES: SourceType[] = Object.values(SourceType);

/**
 * Question types (1–6). See supabase/migrations/0002_exam_engine.sql for the
 * canonical mapping.
 *   1 = choose the correct answer (MCQ)            — auto-graded
 *   2 = choose the wrong answer (MCQ)              — auto-graded
 *   3 = respond to a situation (spoken)            — AI-graded later
 *   4 = given a definition, name the term           — auto-graded
 *   5 = given a term, write the definition          — AI-graded later
 *   6 = speaking question about the source (spoken) — AI-graded later
 */
export enum QuestionType {
  ChooseCorrect = 1,
  ChooseWrong = 2,
  RespondToSituation = 3,
  NameTheTerm = 4,
  WriteTheDefinition = 5,
  SpeakAboutSource = 6,
}

/** Human labels for the question types (admin/preview surfaces). */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.ChooseCorrect]: "Choose the correct answer",
  [QuestionType.ChooseWrong]: "Choose the wrong answer",
  [QuestionType.RespondToSituation]: "Respond to a situation (spoken)",
  [QuestionType.NameTheTerm]: "Name the term",
  [QuestionType.WriteTheDefinition]: "Write the definition",
  [QuestionType.SpeakAboutSource]: "Speaking question about the source",
};

/** Which question types are auto-graded vs. deferred to AI grading. */
export const AUTO_GRADED_TYPES: QuestionType[] = [
  QuestionType.ChooseCorrect,
  QuestionType.ChooseWrong,
  QuestionType.NameTheTerm,
];

export function isAutoGraded(type: QuestionType): boolean {
  return AUTO_GRADED_TYPES.includes(type);
}

/** LBE level 1–5, one per exam Section. */
export enum LbeLevel {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
}

/** Number of items per section (used by the provisional scorer). */
export const ITEMS_PER_SECTION = 10;
/** Auto-graded correct answers needed for a provisional section pass. */
export const SECTION_PASS_THRESHOLD = 6;

/** A single MCQ option. */
export type ItemOption = { id: string; text: string };

/**
 * answer_key shapes by question type:
 *   type 1 & 2: { correct: string }   — the option id to select
 *   type 4:     { accept: string[] }  — accepted terms (case/fuzzy matched)
 *   type 3/5/6: null                  — no auto-grading key
 */
export type AnswerKey =
  | { correct: string }
  | { accept: string[] }
  | Record<string, unknown>
  | null;

/** Item row as consumed by the engine (subset of the DB row). */
export interface ExamItem {
  id: string;
  exam_id: string | null;
  source_type: SourceType | null;
  question_type: QuestionType;
  lbe_level: LbeLevel;
  prompt: string | null;
  media_url: string | null;
  options: ItemOption[] | null;
  answer_key: AnswerKey;
  rubric: unknown | null;
  active: boolean;
}

/**
 * The `answer` jsonb persisted on a response, keyed by question type:
 *   type 1/2: { selected: string }
 *   type 4:   { text: string }
 *   type 5:   { definition: string }
 *   type 3/6: { audio_path: string } (Storage path) or { captured: true } in
 *             preview mode where no upload happens.
 */
export type ResponseAnswer =
  | { selected: string }
  | { text: string }
  | { definition: string }
  | { audio_path: string }
  | { captured: boolean }
  | null;
