"use client";

import * as React from "react";
import { Mic, Square, RotateCcw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuestionType, type ExamItem, type ResponseAnswer } from "@/lib/exam/types";

type Phase = "idle" | "recording" | "recorded" | "uploading" | "uploaded" | "error";

/**
 * Types 3 (respond to a situation) and 6 (speaking question about the source).
 *
 * Real browser recording via the MediaRecorder API: record → stop → playback
 * preview → optional re-record → submit. On submit, if an `uploader` is
 * provided the blob is uploaded (to the private responses-audio bucket) and the
 * returned Storage path is written to `answer.audio_path`. Without an uploader
 * (e.g. the dev preview), the clip is captured locally and marked as such.
 *
 * No AI grading here — that is a separate later step.
 */
export function AudioRecordQuestion({
  item,
  value,
  onChange,
  disabled,
  uploader,
}: {
  item: ExamItem;
  value: ResponseAnswer;
  onChange: (answer: ResponseAnswer) => void;
  disabled?: boolean;
  /** Uploads the blob and resolves to a Storage path. Omit for capture-only. */
  uploader?: (blob: Blob) => Promise<string>;
}) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const blobRef = React.useRef<Blob | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const isSpeakingAboutSource =
    item.question_type === QuestionType.SpeakAboutSource;
  const instruction = isSpeakingAboutSource
    ? "Record your spoken answer to the question about the source."
    : "Record your spoken response to the situation.";

  const cleanupStream = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Revoke object URLs + release the mic on unmount.
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      cleanupStream();
    };
  }, [previewUrl, cleanupStream]);

  const startRecording = async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Recording isn't supported in this browser.");
      setPhase("error");
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

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mime || "audio/webm",
        });
        blobRef.current = blob;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("recorded");
        cleanupStream();
      };

      recorder.start();
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setPhase("recording");
    } catch {
      setError("Microphone access was blocked. Allow it and try again.");
      setPhase("error");
      cleanupStream();
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const reRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
    setElapsed(0);
    setPhase("idle");
    onChange(null);
  };

  const submit = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    if (!uploader) {
      // Capture-only mode (dev preview): no upload, just mark captured.
      onChange({ captured: true });
      setPhase("uploaded");
      return;
    }
    setPhase("uploading");
    setError(null);
    try {
      const path = await uploader(blob);
      onChange({ audio_path: path });
      setPhase("uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setPhase("error");
    }
  };

  const alreadySubmitted =
    (value && "audio_path" in value) || (value && "captured" in value);

  return (
    <div className="space-y-3 rounded-xl border border-gold/25 bg-gold/5 p-4">
      <p className="text-sm font-medium text-gold">{instruction}</p>

      {/* Controls by phase */}
      <div className="flex flex-wrap items-center gap-2.5">
        {(phase === "idle" || phase === "error") && !alreadySubmitted && (
          <Button type="button" variant="gold" size="sm" onClick={startRecording} disabled={disabled}>
            <Mic className="size-4" />
            Record
          </Button>
        )}

        {phase === "recording" && (
          <>
            <Button type="button" variant="dark" size="sm" onClick={stopRecording}>
              <Square className="size-4" />
              Stop
            </Button>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
              <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
              Recording… {formatTime(elapsed)}
            </span>
          </>
        )}

        {(phase === "recorded" || phase === "uploading") && (
          <>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={submit}
              disabled={phase === "uploading"}
            >
              {phase === "uploading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Use this recording"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reRecord}
              disabled={phase === "uploading"}
            >
              <RotateCcw className="size-4" />
              Re-record
            </Button>
          </>
        )}

        {phase === "uploaded" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
              <CheckCircle2 className="size-4" />
              {uploader ? "Recording uploaded" : "Recording captured"}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={reRecord} disabled={disabled}>
              <RotateCcw className="size-4" />
              Re-record
            </Button>
          </div>
        )}
      </div>

      {/* Playback preview */}
      {previewUrl && phase !== "recording" && (
        <audio controls src={previewUrl} className="w-full" />
      )}

      {error && (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}

      {!uploader && (
        <p className="text-xs text-muted-foreground">
          Preview mode: recording stays in your browser and is not uploaded.
        </p>
      )}
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
