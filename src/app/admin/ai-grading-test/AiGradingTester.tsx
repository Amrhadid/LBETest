"use client";

import * as React from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Loader2,
  Sparkles,
  CircleCheck,
  CircleX,
  Check,
  X,
} from "lucide-react";
import fixWebmDuration from "fix-webm-duration";

import { Button } from "@/components/ui/button";

export interface TestItem {
  id: string;
  prompt: string;
  questionType: number;
  questionTypeLabel: string;
  lbeLevel: number | null;
  isVoice: boolean;
}

interface GradeResult {
  score: number;
  confidence: number;
  feedback: string;
  criteria: { id: string; met: boolean; note?: string }[];
  is_correct: boolean;
}

interface TestResponse {
  transcript?: string;
  speakerCount?: number;
  grade?: GradeResult;
  maxScore?: number;
  error?: string;
}

export function AiGradingTester({ items }: { items: TestItem[] }) {
  const [selectedId, setSelectedId] = React.useState("");
  const item = items.find((i) => i.id === selectedId) ?? null;

  const [text, setText] = React.useState("");
  const [grading, startGrading] = React.useState(false);
  const [result, setResult] = React.useState<TestResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Recording state (voice items).
  const [recPhase, setRecPhase] = React.useState<"idle" | "recording" | "recorded">("idle");
  const [elapsed, setElapsed] = React.useState(0);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const blobRef = React.useRef<Blob | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = React.useRef(0);

  const resetAll = React.useCallback(() => {
    setResult(null);
    setError(null);
    setText("");
    setRecPhase("idle");
    setElapsed(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
  }, [previewUrl]);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  React.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    cleanupStream();
  }, [previewUrl]);

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg"
          : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const type = mime || "audio/webm";
        const raw = new Blob(chunksRef.current, { type });
        let blob = raw;
        if (type.includes("webm") && startedAtRef.current > 0) {
          try {
            blob = await fixWebmDuration(raw, Math.max(0, performance.now() - startedAtRef.current));
          } catch {
            blob = raw;
          }
        }
        blobRef.current = blob;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        setRecPhase("recorded");
        cleanupStream();
      };
      recorder.start();
      startedAtRef.current = performance.now();
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setRecPhase("recording");
    } catch {
      setError("Microphone access was blocked. Allow it and try again.");
      cleanupStream();
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const grade = async () => {
    if (!item) return;
    setError(null);
    setResult(null);
    const fd = new FormData();
    fd.append("itemId", item.id);
    if (item.isVoice) {
      if (!blobRef.current) {
        setError("Record an answer first.");
        return;
      }
      fd.append("audio", blobRef.current, "answer.webm");
    } else {
      if (!text.trim()) {
        setError("Type an answer first.");
        return;
      }
      fd.append("text", text);
    }
    startGrading(true);
    try {
      const res = await fetch("/admin/ai-grading-test/grade", { method: "POST", body: fd });
      const data = (await res.json()) as TestResponse;
      if (!res.ok || data.error) {
        setError(data.error ?? `Request failed (${res.status}).`);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      startGrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Question picker */}
      <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
        <label htmlFor="item" className="mb-1.5 block text-sm font-medium text-charcoal">
          Question
        </label>
        <select
          id="item"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            resetAll();
          }}
          className="w-full rounded-lg border border-gold/25 bg-background px-3 py-2.5 text-sm"
        >
          <option value="">Select a question…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.lbeLevel ? `LBE ${i.lbeLevel} · ` : ""}
              {i.questionTypeLabel} — {i.prompt.slice(0, 70)}
              {i.prompt.length > 70 ? "…" : ""}
            </option>
          ))}
        </select>
        {items.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No active AI-graded questions (types 3–6) in the library yet.
          </p>
        )}
      </div>

      {item && (
        <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-gold/15 px-2 py-0.5 font-medium text-charcoal">
              {item.questionTypeLabel}
            </span>
            {item.lbeLevel != null && (
              <span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-charcoal/70">
                Section {item.lbeLevel}
              </span>
            )}
            <span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-charcoal/70">
              {item.isVoice ? "Voice" : "Text"}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-base font-medium text-charcoal">{item.prompt}</p>

          {/* Answer input */}
          <div className="mt-5">
            {item.isVoice ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {(recPhase === "idle") && (
                    <Button type="button" variant="gold" size="sm" onClick={startRecording}>
                      <Mic className="size-4" /> Record answer
                    </Button>
                  )}
                  {recPhase === "recording" && (
                    <>
                      <Button type="button" variant="dark" size="sm" onClick={stopRecording}>
                        <Square className="size-4" /> Stop
                      </Button>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                        <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
                        {formatTime(elapsed)}
                      </span>
                    </>
                  )}
                  {recPhase === "recorded" && (
                    <Button type="button" variant="outline" size="sm" onClick={() => { resetAll(); }}>
                      <RotateCcw className="size-4" /> Re-record
                    </Button>
                  )}
                </div>
                {previewUrl && recPhase !== "recording" && (
                  <audio controls src={previewUrl} className="w-full max-w-md" />
                )}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Type the candidate answer to grade…"
                className="w-full rounded-lg border border-gold/25 bg-background px-3 py-2.5 text-sm"
              />
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="gold"
              size="md"
              onClick={grade}
              disabled={grading || (item.isVoice ? recPhase !== "recorded" : !text.trim())}
            >
              {grading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {grading ? "Grading…" : "Run AI grading"}
            </Button>
            {error && <span className="text-sm text-rose-700">{error}</span>}
          </div>
        </div>
      )}

      {/* Result */}
      {result?.grade && item && (
        <div className="rounded-2xl border border-border bg-ivory/60 p-6">
          <h3 className="font-serif-display text-xl text-charcoal">Result</h3>

          {item.isVoice && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                Transcript{" "}
                {result.speakerCount && result.speakerCount > 1 && (
                  <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                    {result.speakerCount} speakers detected
                  </span>
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
                {result.transcript || <span className="italic text-charcoal/40">(no speech detected)</span>}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-charcoal">
              {result.grade.score} / {result.maxScore ?? 1}
            </span>
            <span
              className={
                "inline-flex items-center gap-1 text-sm " +
                (result.grade.is_correct ? "text-emerald-700" : "text-rose-700")
              }
            >
              {result.grade.is_correct ? <CircleCheck className="size-4" /> : <CircleX className="size-4" />}
              {result.grade.is_correct ? "pass" : "fail"}
            </span>
            <span
              className={
                "text-xs " +
                (result.grade.confidence < 0.6 ? "font-semibold text-amber-700" : "text-charcoal/60")
              }
            >
              confidence {(result.grade.confidence * 100).toFixed(0)}%
              {result.grade.confidence < 0.6 ? " · low" : ""}
            </span>
          </div>

          {result.grade.feedback && (
            <p className="mt-2 text-sm text-charcoal/80">{result.grade.feedback}</p>
          )}
          {result.grade.criteria.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {result.grade.criteria.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  {c.met ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-rose-600" />
                  )}
                  <span className="text-charcoal/80">
                    <span className="font-medium">{c.id}</span>
                    {c.note ? ` — ${c.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-charcoal/50">
            Test run only — this grade is not saved anywhere.
          </p>
        </div>
      )}
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
