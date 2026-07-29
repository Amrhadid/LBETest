"use client";

import * as React from "react";
import { AlertTriangle, Clock, Maximize } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient, type PublicSupabaseConfig } from "@/lib/supabase/client";
import { uploadResponseAudio } from "@/lib/exam/storage";
import { QuestionType, type ExamItem, type ResponseAnswer, type LbeLevel } from "@/lib/exam/types";
import { SectionBadge } from "@/components/exam/SectionBadge";
import { SourceStimulus } from "@/components/exam/SourceStimulus";
import { QuestionRenderer } from "@/components/exam/QuestionRenderer";
import { SubmittedScreen } from "@/components/exam/SubmittedScreen";
import { RoomScanGate } from "@/components/exam/RoomScanGate";
import { saveResponse, logEvent, submitAttempt, scoreSection, beginSection, recordAttemptMeta } from "@/app/start/actions";

export type RunnerSection = { level: LbeLevel; items: ExamItem[] };

/**
 * The interactive exam runner. Presents 5 sections in strict order with a
 * per-section timer, autosaves every answer, logs lockdown telemetry, and
 * submits at the end. Never reveals correctness/score to the candidate.
 */
export function ExamRunner({
  attemptId,
  userId,
  sectionSeconds,
  initialTimeLeft,
  sections,
  initialResponses,
  initialSectionIndex,
  config,
  isPreview = false,
  initialRoomScanPath = null,
}: {
  attemptId: string;
  userId: string;
  sectionSeconds: number;
  /** Server-computed seconds left in the current section on load. */
  initialTimeLeft: number;
  sections: RunnerSection[];
  initialResponses: Record<string, ResponseAnswer>;
  initialSectionIndex: number;
  config?: PublicSupabaseConfig;
  /** Reviewer/preview run: skip fingerprint + room scan entirely. */
  isPreview?: boolean;
  /** Existing room-scan path (or skip marker) — non-null means already done. */
  initialRoomScanPath?: string | null;
}) {
  const [sectionIndex, setSectionIndex] = React.useState(
    Math.min(initialSectionIndex, sections.length - 1),
  );
  const [answers, setAnswers] = React.useState<Record<string, ResponseAnswer>>(
    initialResponses,
  );
  // Timer starts from the SERVER-computed remaining time, not a fresh full
  // countdown — a resumed section reflects real elapsed time.
  const [timeLeft, setTimeLeft] = React.useState(initialTimeLeft);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  // Room scan (#6): only gate a real attempt that hasn't been scanned yet, and
  // only ever before section 1. Preview runs never scan.
  const [scanDone, setScanDone] = React.useState(
    isPreview || initialRoomScanPath != null || initialSectionIndex > 0,
  );
  // True once the first section has mounted (so later sections reset to full).
  const firstMountRef = React.useRef(true);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const supabase = React.useMemo(() => createClient(config), [config]);
  const debounceTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Guards against double-submitting a section (timer + click racing).
  const advancingRef = React.useRef(false);

  const section = sections[sectionIndex];
  const isLastSection = sectionIndex === sections.length - 1;

  // ---- Device fingerprint (#8): compute once, persist on the attempt -------
  React.useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    (async () => {
      try {
        const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
        const agent = await FingerprintJS.load();
        const { visitorId } = await agent.get();
        if (!cancelled && visitorId) {
          await recordAttemptMeta(attemptId, { fingerprint: visitorId });
        }
      } catch {
        // Fingerprinting is best-effort; never blocks the exam.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, isPreview]);

  // ---- Lockdown: fullscreen + telemetry -----------------------------------
  const requestFullscreen = React.useCallback(() => {
    containerRef.current?.requestFullscreen?.().catch(() => {
      /* user or browser may deny; that's fine, we just log exits */
    });
  }, []);

  React.useEffect(() => {
    requestFullscreen();
    // Lockdown telemetry is delivered by sendBeacon — reliable while the tab is
    // backgrounding (a Server Action fetch here gets dropped by the browser).
    const beacon = (type: string, payload: Record<string, unknown>) => {
      try {
        navigator.sendBeacon?.(
          "/api/attempt-event",
          new Blob([JSON.stringify({ attemptId, type, payload })], {
            type: "application/json",
          }),
        );
      } catch {
        /* telemetry is best-effort */
      }
    };

    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) beacon("fullscreen_exit", {});
    };
    const onVisibility = () => {
      if (document.hidden) beacon("tab_blur", { reason: "visibility" });
    };
    const onBlur = () => beacon("tab_blur", { reason: "window_blur" });
    const onPageHide = () => beacon("pagehide", {});

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [attemptId, requestFullscreen]);

  // ---- Per-section lifecycle: record start (server anchor), set timer ------
  React.useEffect(() => {
    if (done) return;
    // Idempotent server-recorded anchor (reloading can't reset the clock).
    void beginSection(attemptId, section.level);
    // Keep the server-computed remaining time on the FIRST mount; a genuinely
    // new section (advancing) starts from the full limit.
    if (firstMountRef.current) firstMountRef.current = false;
    else setTimeLeft(sectionSeconds);
    advancingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIndex]);

  // ---- Auto-submit a section whose time is already up (e.g. on return) -----
  React.useEffect(() => {
    if (!done && timeLeft <= 0 && !advancingRef.current) {
      void handleAdvance(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, done]);

  // ---- Timer --------------------------------------------------------------
  React.useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          void handleAdvance(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIndex, done]);

  // ---- Answering + autosave ----------------------------------------------
  const persist = React.useCallback(
    (itemId: string, answer: ResponseAnswer) => {
      void saveResponse(attemptId, itemId, answer);
    },
    [attemptId],
  );

  const handleAnswer = React.useCallback(
    (item: ExamItem, answer: ResponseAnswer) => {
      setAnswers((prev) => ({ ...prev, [item.id]: answer }));

      // Debounce free-text saves; save selects/audio immediately.
      const isText =
        item.question_type === QuestionType.NameTheTerm ||
        item.question_type === QuestionType.WriteTheDefinition;
      if (isText) {
        clearTimeout(debounceTimers.current[item.id]);
        debounceTimers.current[item.id] = setTimeout(
          () => persist(item.id, answer),
          800,
        );
      } else {
        persist(item.id, answer);
      }
    },
    [persist],
  );

  // Flush any pending debounced text saves.
  const flushPending = React.useCallback(() => {
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
  }, []);

  // ---- Section advance / final submit -------------------------------------
  async function handleAdvance(auto: boolean) {
    if (advancingRef.current || done) return;
    advancingRef.current = true;
    setSubmitting(true);
    flushPending();

    // Persist current section answers synchronously (best-effort) before moving.
    for (const item of section.items) {
      const a = answers[item.id];
      if (a !== undefined && a !== null) persist(item.id, a);
    }

    await logEvent(attemptId, "section_submit", { section: section.level, auto });

    // Server-side auto-scoring of this section's selection items. Result is
    // never returned to the candidate (no interim feedback).
    await scoreSection(attemptId, section.level);

    if (isLastSection) {
      await submitAttempt(attemptId);
      setDone(true);
      setSubmitting(false);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      return;
    }

    setSectionIndex((i) => i + 1);
    setSubmitting(false);
  }

  const makeUploader = React.useCallback(
    (itemId: string) => async (blob: Blob) =>
      uploadResponseAudio({ supabase, blob, userId, attemptId, itemId }),
    [supabase, userId, attemptId],
  );

  if (done) {
    return (
      <div className="py-8">
        <SubmittedScreen />
      </div>
    );
  }

  // Gate a fresh real attempt behind the room scan before section 1.
  if (!scanDone) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="container mx-auto px-4">
          <RoomScanGate
            supabase={supabase}
            userId={userId}
            attemptId={attemptId}
            onDone={() => setScanDone(true)}
          />
        </div>
      </div>
    );
  }

  const answeredCount = section.items.filter(
    (it) => answers[it.id] !== undefined && answers[it.id] !== null,
  ).length;

  return (
    <div ref={containerRef} className="min-h-dvh bg-background">
      {/* Sticky exam header: section, progress, timer. No scores. */}
      <div className="sticky top-0 z-30 border-b border-gold/20 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <SectionBadge level={section.level} />
            <span className="text-sm text-muted-foreground">
              Section {sectionIndex + 1} of {sections.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isFullscreen && (
              <Button type="button" variant="ghost" size="sm" onClick={requestFullscreen}>
                <Maximize className="size-4" />
                Fullscreen
              </Button>
            )}
            <Timer timeLeft={timeLeft} />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <p className="mb-8 text-sm text-muted-foreground">
          Answer every question. Your answers save automatically. When you
          continue, this section closes and cannot be reopened.
        </p>

        <ol className="space-y-10">
          {section.items.map((item, idx) => (
            <li key={item.id} className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="font-serif-display text-2xl text-gold">
                  {idx + 1}
                </span>
              </div>

              {/* The prompt (passage + question) renders once here, in a
                  labelled card; for audio items this is the listening player. */}
              <SourceStimulus item={item} />

              <QuestionRenderer
                item={item}
                value={answers[item.id] ?? null}
                onChange={(a) => handleAnswer(item, a)}
                disabled={submitting || timeLeft <= 0}
                revealResult={false}
                disableClipboard
                uploader={
                  item.question_type === QuestionType.RespondToSituation ||
                  item.question_type === QuestionType.SpeakAboutSource
                    ? makeUploader(item.id)
                    : undefined
                }
              />
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-gold/20 pt-8">
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {section.items.length} answered
          </p>
          <ContinueButton
            isLast={isLastSection}
            submitting={submitting}
            onConfirm={() => handleAdvance(false)}
          />
          <p className="max-w-sm text-center text-xs text-muted-foreground">
            You can&rsquo;t return to this section after continuing.
          </p>
        </div>
      </div>
    </div>
  );
}

function Timer({ timeLeft }: { timeLeft: number }) {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const low = timeLeft <= 30;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums",
        low
          ? "border-red-300/60 bg-red-50 text-red-700"
          : "border-gold/40 bg-gold/8 text-charcoal",
      )}
      aria-live={low ? "assertive" : "off"}
    >
      <Clock className="size-4" />
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}

function ContinueButton({
  isLast,
  submitting,
  onConfirm,
}: {
  isLast: boolean;
  submitting: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="gold"
        size="lg"
        disabled={submitting}
        onClick={() => setConfirming(true)}
      >
        {isLast ? "Finish exam" : "Submit section & continue"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-charcoal">
        <AlertTriangle className="size-4 text-gold" />
        {isLast
          ? "Submit the exam? You can't make changes after this."
          : "Continue to the next section? You can't come back."}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="gold" size="sm" disabled={submitting} onClick={onConfirm}>
          {submitting ? "Please wait…" : isLast ? "Submit exam" : "Continue"}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
