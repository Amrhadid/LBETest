"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  uploadRecordingChunk,
  type RecordingKind,
} from "@/lib/exam/storage";
import { markRecordingPresence } from "@/app/start/actions";

/** Chunk cadence + face-sample cadence. Low/cost-optimized defaults. */
const CHUNK_MS = 30_000; // 30s recording chunks
const FRAME_SAMPLE_MS = 60_000; // 1 face-detection frame per 60s
const FRAME_MAX_DIM = 512; // downscale sampled frames to bound API payload
// Low-bitrate encoding keeps ~150-300 MB total per 60-min attempt.
const VIDEO_BPS = 400_000; // webcam
const SCREEN_BPS = 500_000; // screen
const AUDIO_BPS = 32_000; // mic

interface Manager {
  streams: MediaStream[];
  recorders: MediaRecorder[];
  timers: ReturnType<typeof setInterval>[];
  counters: Record<RecordingKind, number>;
  frameVideo?: HTMLVideoElement;
  frameCanvas?: HTMLCanvasElement;
  stopped: boolean;
}

function pickVideoMime(): string {
  return MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
    ? "video/webm;codecs=vp8"
    : "video/webm";
}
function pickAudioMime(): string {
  return MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
}

/**
 * Continuous proctoring capture (#2/#3/#4 + #5). Records webcam, microphone,
 * and screen as separate chunked streams uploaded straight to the private
 * attempt-recordings bucket, and samples one webcam frame per minute to the AI
 * face check. All best-effort — a denied permission or failed upload is logged
 * to the console and skipped, never blocking the exam.
 *
 * getDisplayMedia (screen) MUST be called from a user gesture, so `start()` is
 * wired to a "Begin monitored exam" button, not an effect.
 */
export function useAttemptCapture({
  supabase,
  userId,
  attemptId,
  enabled,
}: {
  supabase: SupabaseClient;
  userId: string;
  attemptId: string;
  enabled: boolean;
}) {
  const mgr = React.useRef<Manager | null>(null);

  const stop = React.useCallback(() => {
    const m = mgr.current;
    if (!m) return;
    m.stopped = true;
    m.timers.forEach(clearInterval);
    m.recorders.forEach((r) => {
      try {
        if (r.state !== "inactive") r.stop();
      } catch {
        /* noop */
      }
    });
    m.streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    mgr.current = null;
  }, []);

  React.useEffect(() => () => stop(), [stop]);

  const startKind = React.useCallback(
    (m: Manager, kind: RecordingKind, stream: MediaStream, opts: MediaRecorderOptions) => {
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(stream, opts);
      } catch {
        return;
      }
      rec.ondataavailable = async (e) => {
        if (!e.data || e.data.size === 0 || m.stopped) return;
        const index = m.counters[kind]++;
        try {
          await uploadRecordingChunk({
            supabase,
            blob: e.data,
            userId,
            attemptId,
            kind,
            index,
          });
          if (index === 0) void markRecordingPresence(attemptId, { [kind]: true });
        } catch {
          /* best-effort chunk upload */
        }
      };
      try {
        rec.start(CHUNK_MS);
        m.recorders.push(rec);
      } catch {
        /* noop */
      }
    },
    [supabase, userId, attemptId],
  );

  const sampleFrame = React.useCallback(
    async (m: Manager) => {
      const video = m.frameVideo;
      const canvas = m.frameCanvas;
      if (!video || !canvas || m.stopped) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;
      const scale = Math.min(1, FRAME_MAX_DIM / Math.max(vw, vh));
      canvas.width = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) return;
      try {
        await fetch("/api/proctor-frame", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ attemptId, image: base64 }),
          keepalive: true,
        });
      } catch {
        /* face-sample is best-effort */
      }
    },
    [attemptId],
  );

  /** Request permissions + begin capture. Returns true if anything started. */
  const start = React.useCallback(async (): Promise<boolean> => {
    if (!enabled || mgr.current) return false;
    const m: Manager = {
      streams: [],
      recorders: [],
      timers: [],
      counters: { webcam: 0, mic: 0, screen: 0 },
      stopped: false,
    };

    // Webcam + mic in one prompt, then split into video-only / audio-only.
    try {
      const av = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 10 },
        audio: true,
      });
      m.streams.push(av);
      const vTrack = av.getVideoTracks()[0];
      const aTrack = av.getAudioTracks()[0];
      if (vTrack) {
        startKind(m, "webcam", new MediaStream([vTrack]), {
          mimeType: pickVideoMime(),
          videoBitsPerSecond: VIDEO_BPS,
        });
        // Hidden video element to sample frames from the webcam track.
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = new MediaStream([vTrack]);
        await video.play().catch(() => {});
        m.frameVideo = video;
        m.frameCanvas = document.createElement("canvas");
        m.timers.push(setInterval(() => void sampleFrame(m), FRAME_SAMPLE_MS));
      }
      if (aTrack) {
        startKind(m, "mic", new MediaStream([aTrack]), {
          mimeType: pickAudioMime(),
          audioBitsPerSecond: AUDIO_BPS,
        });
      }
    } catch {
      /* camera/mic denied — continue; the missing streams are visible to admin */
    }

    // Screen capture (separate user-facing prompt).
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      });
      m.streams.push(screen);
      startKind(m, "screen", screen, {
        mimeType: pickVideoMime(),
        videoBitsPerSecond: SCREEN_BPS,
      });
    } catch {
      /* screen share denied — continue */
    }

    mgr.current = m;
    return m.recorders.length > 0;
  }, [enabled, startKind, sampleFrame]);

  return { start, stop };
}
