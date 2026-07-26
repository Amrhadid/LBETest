import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  type ExamItem,
  type ItemOption,
  type AnswerKey,
  type SourceType,
  type QuestionType,
  type LbeLevel,
} from "@/lib/exam/types";
import { ItemPreviewClient } from "@/app/dev/item-preview/ItemPreviewClient";

export const metadata: Metadata = {
  title: "Item preview (dev)",
  robots: { index: false, follow: false },
};

// Always render fresh from the database.
export const dynamic = "force-dynamic";

const PLACEHOLDER_EXAM_ID = "11111111-1111-1111-1111-111111111111";

/** Map a raw DB row to the engine's ExamItem shape. */
function toExamItem(row: Record<string, unknown>): ExamItem {
  return {
    id: String(row.id),
    exam_id: (row.exam_id as string | null) ?? null,
    source_type: (row.source_type as SourceType | null) ?? null,
    question_type: row.question_type as QuestionType,
    lbe_level: row.lbe_level as LbeLevel,
    prompt: (row.prompt as string | null) ?? null,
    media_url: (row.media_url as string | null) ?? null,
    options: (row.options as ItemOption[] | null) ?? null,
    answer_key: (row.answer_key as AnswerKey) ?? null,
    rubric: row.rubric ?? null,
    active: Boolean(row.active),
  };
}

export default async function ItemPreviewPage() {
  let items: ExamItem[] = [];
  let loadError: string | null = null;

  try {
    // Dev tool: read with the service-role client so it works without auth
    // (items are staff-only under RLS).
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("items")
      .select(
        "id, exam_id, source_type, question_type, lbe_level, prompt, media_url, options, answer_key, rubric, active",
      )
      .eq("exam_id", PLACEHOLDER_EXAM_ID)
      .order("lbe_level", { ascending: true })
      .order("question_type", { ascending: true });

    if (error) throw error;
    items = (data ?? []).map((r) => toExamItem(r as Record<string, unknown>));
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load items.";
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* Clearly-marked temporary dev tool banner. */}
        <div className="mb-10 flex items-start gap-3 rounded-2xl border border-amber-400/50 bg-amber-50 p-4 text-amber-900">
          <FlaskConical className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Temporary dev tool — not for production</p>
            <p className="text-sm">
              Renders the placeholder seed items through the exam-engine
              components with live provisional scoring. No auth, no exam timer,
              recordings are not uploaded. Remove before launch.
            </p>
          </div>
        </div>

        <header className="mb-10">
          <p className="eyebrow">Exam engine</p>
          <h1 className="font-serif-display mt-2 text-4xl text-charcoal sm:text-5xl">
            Item preview
          </h1>
          <p className="mt-3 text-muted-foreground">
            {items.length} placeholder items across {new Set(items.map((i) => i.lbe_level)).size} sections.
          </p>
        </header>

        {loadError ? (
          <div className="rounded-2xl border border-red-300/60 bg-red-50 p-6 text-red-800">
            <p className="font-semibold">Could not load items.</p>
            <p className="mt-1 text-sm">{loadError}</p>
            <p className="mt-3 text-sm">
              Make sure migrations <code>0001_init.sql</code> and{" "}
              <code>0002_exam_engine.sql</code> are applied and{" "}
              <code>seed_placeholder.sql</code> has been run, and that{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> is set.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-charcoal">
            <p className="font-semibold">No placeholder items found.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run <code>supabase/seed_placeholder.sql</code> to populate the 50
              placeholder items.
            </p>
          </div>
        ) : (
          <ItemPreviewClient items={items} />
        )}
      </div>
    </main>
  );
}
