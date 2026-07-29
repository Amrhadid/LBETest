"use client";

import * as React from "react";
import { Camera, Loader2, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadRoomScan } from "@/lib/exam/storage";
import { saveRoomScan } from "@/app/start/actions";

const SCAN_SECONDS = 6;

/**
 * Pre-exam room scan (#6): records a few seconds of webcam video, uploads it to
 * the private room-scans bucket, and persists the path on the attempt. No AI —
 * it's a deterrent + a reviewable clip. The candidate may skip if their camera
 * is unavailable (recorded as skipped so it doesn't silently pass).
 */
export function RoomScanGate({
  supabase,
  userId,
  attemptId,
  onDone,
  ensureCamera,
}: {
  supabase: SupabaseClient;
  userId: string;
  attemptId: string;
  onDone: () => void;
  /** Return the shared camera+mic stream (already granted at the ID step). */
  ensureCamera: () => Promise<MediaStream | null>;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [phase, setPhase] = React.useState<
    "idle" | "ready" | "recording" | "uploading" | "error"
  >("idle");
  const [countdown, setCountdown] = React.useState(SCAN_SECONDS);
  const [errMsg, setErrMsg] = React.useState<string>("");

  // Detach the preview only; the shared stream is owned by the runner and reused
  // by the continuous recording — never stop it here.
  const detachPreview = React.useCallback(() => {
    if (videoRef.current) videoRef.current.srcObject = null;
    streamRef.current = null;
  }, []);

  React.useEffect(() => () => detachPreview(), [detachPreview]);

  const enableCamera = React.useCallback(async () => {
    const stream = await ensureCamera();
    if (!stream) {
      setErrMsg("We couldn't access your camera.");
      setPhase("error");
      return;
    }
    streamRef.current = stream;
    if (videoRef.current) {
      const v = stream.getVideoTracks()[0];
      videoRef.current.srcObject = v ? new MediaStream([v]) : stream;
      await videoRef.current.play().catch(() => {});
    }
    setPhase("ready");
  }, [ensureCamera]);

  const record = React.useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) return;
    setPhase("recording");
    setCountdown(SCAN_SECONDS);

    // Record the video track only (no audio in the room-scan clip).
    const vTrack = stream.getVideoTracks()[0];
    const recStream = vTrack ? new MediaStream([vTrack]) : stream;
    const chunks: BlobPart[] = [];
    const mime = MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "";
    const rec = new MediaRecorder(recStream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const done = new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
    });

    rec.start();
    const tick = setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1000,
    );
    await new Promise((r) => setTimeout(r, SCAN_SECONDS * 1000));
    clearInterval(tick);
    rec.stop();

    const blob = await done;
    detachPreview();
    setPhase("uploading");
    try {
      const path = await uploadRoomScan({ supabase, blob, userId, attemptId });
      await saveRoomScan(attemptId, path);
    } catch {
      // Upload failed — let them proceed rather than trap them out of the exam.
    }
    onDone();
  }, [supabase, userId, attemptId, onDone, detachPreview]);

  const skip = React.useCallback(() => {
    detachPreview();
    // Record the skip so the attempt shows the scan was declined, then proceed.
    void saveRoomScan(attemptId, `${userId}/${attemptId}/room-scan-skipped`);
    onDone();
  }, [detachPreview, attemptId, userId, onDone]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="eyebrow">Before you begin</p>
      <h1 className="font-serif-display mt-3 text-3xl text-charcoal">
        Quick room scan
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We&rsquo;ll record a {SCAN_SECONDS}-second clip of your surroundings for
        exam integrity. Please show your desk and the area around you.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gold/25 bg-charcoal/5">
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-video w-full bg-charcoal/80 object-cover"
        />
      </div>

      {phase === "recording" && (
        <p className="mt-3 text-sm font-semibold text-red-600">
          Recording… {countdown}s
        </p>
      )}
      {phase === "error" && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-amber-700">
          <VideoOff className="size-4" /> {errMsg}
        </p>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        {phase === "idle" && (
          <Button type="button" variant="gold" size="lg" onClick={enableCamera}>
            <Camera className="size-4" /> Enable camera
          </Button>
        )}
        {phase === "ready" && (
          <Button type="button" variant="gold" size="lg" onClick={record}>
            <Camera className="size-4" /> Start {SCAN_SECONDS}s scan
          </Button>
        )}
        {(phase === "recording" || phase === "uploading") && (
          <Button type="button" variant="gold" size="lg" disabled>
            <Loader2 className="size-4 animate-spin" />
            {phase === "uploading" ? "Saving…" : "Recording…"}
          </Button>
        )}
        {phase !== "recording" && phase !== "uploading" && (
          <button
            type="button"
            onClick={skip}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            My camera isn&rsquo;t available — skip
          </button>
        )}
      </div>
    </div>
  );
}
