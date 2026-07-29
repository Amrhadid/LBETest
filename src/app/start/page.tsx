import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { SubmittedScreen } from "@/components/exam/SubmittedScreen";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import { ACTIVE_EXAM_ID, parseExamConfig } from "@/lib/exam/config";
import { getSectionAnchors } from "@/lib/exam/timing.server";
import { remainingSeconds, attemptExpired } from "@/lib/exam/timing";
import { submitAttempt } from "@/app/start/actions";
import {
  type ExamItem,
  type ItemOption,
  type ResponseAnswer,
  type SourceType,
  type QuestionType,
  type LbeLevel,
} from "@/lib/exam/types";
import { StartGate } from "@/app/start/StartGate";
import { ExamRunner, type RunnerSection } from "@/app/start/ExamRunner";

export const metadata: Metadata = {
  title: "Take the test",
  description: "Start the Locrativ Business English Test (LBET).",
};

export const dynamic = "force-dynamic";

/** Map a raw items row to a client-safe ExamItem (answer_key/rubric stripped). */
function toClientItem(row: Record<string, unknown>): ExamItem {
  return {
    id: String(row.id),
    exam_id: (row.exam_id as string | null) ?? null,
    source_type: (row.source_type as SourceType | null) ?? null,
    question_type: row.question_type as QuestionType,
    lbe_level: row.lbe_level as LbeLevel,
    prompt: (row.prompt as string | null) ?? null,
    media_url: (row.media_url as string | null) ?? null,
    options: (row.options as ItemOption[] | null) ?? null,
    // Never send grading data to the candidate.
    answer_key: null,
    rubric: null,
    active: Boolean(row.active),
  };
}

/** Load all active items for the exam, grouped into ordered sections 1..5. */
async function loadSections(): Promise<RunnerSection[]> {
  const svc = createServiceRoleClient();
  const { data } = await svc
    .from("items")
    .select(
      "id, exam_id, source_type, question_type, lbe_level, prompt, media_url, options, active",
    )
    .eq("exam_id", ACTIVE_EXAM_ID)
    .eq("active", true)
    .order("lbe_level", { ascending: true })
    .order("question_type", { ascending: true })
    .order("id", { ascending: true });

  const byLevel = new Map<LbeLevel, ExamItem[]>();
  for (const row of data ?? []) {
    const item = toClientItem(row as Record<string, unknown>);
    const list = byLevel.get(item.lbe_level) ?? [];
    list.push(item);
    byLevel.set(item.lbe_level, list);
  }

  // Listening audio lives in a private bucket; mint a short-lived signed URL
  // for each audio item so the client <audio> can stream it. Never calls TTS.
  const { signExamAudio } = await import("@/lib/exam/audio.server");
  await Promise.all(
    [...byLevel.values()].flat().map(async (it) => {
      if (it.source_type === "audio" && it.media_url) {
        it.media_url = await signExamAudio(svc, it.media_url);
      }
    }),
  );

  return [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, items]) => ({ level, items }));
}

export default async function StartPage() {
  const supabase = await createClient();
  let user: { id: string; email?: string } | null = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    user = null;
  }
  if (!user) redirect("/login?redirectedFrom=/start");

  // Latest attempts for this user + exam (RLS: own rows only).
  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, status, access_code_id, created_at, started_at, is_preview, room_scan_path")
    .eq("user_id", user.id)
    .eq("exam_id", ACTIVE_EXAM_ID)
    .order("created_at", { ascending: false });

  const submitted = (attempts ?? []).find((a) => a.status === "submitted");
  const inProgress = (attempts ?? []).find((a) => a.status === "in_progress");

  // --- Submitted: show the confirmation screen ---
  if (submitted && !inProgress) {
    return (
      <PageShell>
        <Section>
          <SubmittedScreen />
        </Section>
      </PageShell>
    );
  }

  // --- In progress: run the exam ---
  if (inProgress) {
    const svc = createServiceRoleClient();
    const [{ data: examRow }, sections, { data: responses }, { data: events }] =
      await Promise.all([
        svc.from("exams").select("config").eq("id", ACTIVE_EXAM_ID).maybeSingle(),
        loadSections(),
        supabase
          .from("responses")
          .select("item_id, answer")
          .eq("attempt_id", inProgress.id),
        supabase
          .from("attempt_events")
          .select("type")
          .eq("attempt_id", inProgress.id)
          .eq("type", "section_submit"),
      ]);

    const config = parseExamConfig(examRow?.config);
    const initialResponses: Record<string, ResponseAnswer> = {};
    for (const r of responses ?? []) {
      if (r.item_id) {
        initialResponses[r.item_id as string] = r.answer as ResponseAnswer;
      }
    }
    const initialSectionIndex = Math.min(
      (events ?? []).length,
      Math.max(sections.length - 1, 0),
    );

    // --- Server-anchored time enforcement -------------------------------
    const now = Date.now();
    const startedAtMs = inProgress.started_at
      ? new Date(inProgress.started_at).getTime()
      : now;

    // Whole-attempt cap: sat idle far beyond the total budget → force submit.
    if (
      sections.length > 0 &&
      attemptExpired(startedAtMs, sections.length, config.section_seconds, now)
    ) {
      await submitAttempt(inProgress.id);
      return (
        <PageShell>
          <Section>
            <SubmittedScreen />
          </Section>
        </PageShell>
      );
    }

    // Remaining time in the current section, from its server anchor.
    const anchors = await getSectionAnchors(svc, inProgress.id);
    const currentLevel = sections[initialSectionIndex]?.level;
    const currentAnchor =
      currentLevel != null
        ? anchors.get(currentLevel) ??
          (initialSectionIndex === 0 ? startedAtMs : undefined)
        : undefined;
    const initialTimeLeft = remainingSeconds(
      currentAnchor,
      config.section_seconds,
      now,
    );

    if (sections.length === 0) {
      return (
        <PageShell>
          <Section>
            <div className="mx-auto max-w-lg text-center text-charcoal">
              <p className="font-semibold">This exam has no questions yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please contact us — the exam content isn&rsquo;t available.
              </p>
            </div>
          </Section>
        </PageShell>
      );
    }

    const { url, anonKey } = getServerSupabaseEnv();
    const publicConfig = url && anonKey ? { url, anonKey } : undefined;

    return (
      <ExamRunner
        initialTimeLeft={initialTimeLeft}
        attemptId={inProgress.id}
        userId={user.id}
        sectionSeconds={config.section_seconds}
        sections={sections}
        initialResponses={initialResponses}
        initialSectionIndex={initialSectionIndex}
        config={publicConfig}
        isPreview={Boolean(inProgress.is_preview)}
        initialRoomScanPath={inProgress.room_scan_path ?? null}
      />
    );
  }

  // --- Not yet started: entitlement gate ---
  const { data: codes } = await supabase
    .from("access_codes")
    .select("id")
    .eq("redeemed_by", user.id)
    .eq("exam_id", ACTIVE_EXAM_ID)
    .eq("status", "used");

  const consumed = new Set(
    (attempts ?? []).map((a) => a.access_code_id).filter(Boolean),
  );
  const canStart = (codes ?? []).some((c) => !consumed.has(c.id));

  return (
    <PageShell>
      <Section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pattern-guilloche pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow">Take the test</p>
          <h1 className="font-serif-display mt-3 text-4xl text-charcoal sm:text-5xl">
            The Locrativ Business English Test
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Five timed sections. Results are reviewed and released after grading.
          </p>
        </div>
        <StartGate canStart={canStart} />
      </Section>
    </PageShell>
  );
}
