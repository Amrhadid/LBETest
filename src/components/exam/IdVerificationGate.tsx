"use client";

import * as React from "react";
import { IdCard, Camera, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadIdImage } from "@/lib/exam/storage";
import { cameraErrorMessage } from "@/lib/exam/media";
import { saveIdVerification } from "@/app/start/actions";

/**
 * Mandatory pre-exam ID + selfie verification (#1). The candidate uploads a
 * photo of their ID, then takes a webcam selfie. Both are stored privately and
 * shown side-by-side to an admin for a MANUAL match — no automated matching.
 * There is no skip: the exam cannot start until both are captured.
 */
export function IdVerificationGate({
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
  /** Acquire (once) or return the shared camera+mic stream, plus any error. */
  ensureCamera: () => Promise<{ stream: MediaStream | null; error?: unknown }>;
}) {
  const [nationalId, setNationalId] = React.useState("");
  const [idFile, setIdFile] = React.useState<File | null>(null);
  const [idPreview, setIdPreview] = React.useState<string>("");
  const [selfie, setSelfie] = React.useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = React.useState<string>("");
  const [camOn, setCamOn] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState("");

  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // Detach the preview when leaving; NEVER stop the shared stream here — it is
  // reused by the room scan and the continuous recording.
  const detachPreview = React.useCallback(() => {
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);
  React.useEffect(() => () => detachPreview(), [detachPreview]);

  const onId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setIdFile(f);
    setIdPreview(f ? URL.createObjectURL(f) : "");
  };

  const enableCam = async () => {
    const { stream, error } = await ensureCamera();
    if (!stream) {
      setErr(cameraErrorMessage(error));
      return;
    }
    setErr("");
    setCamOn(true);
    if (videoRef.current) {
      // Show only the video track in the preview.
      const v = stream.getVideoTracks()[0];
      videoRef.current.srcObject = v ? new MediaStream([v]) : stream;
      await videoRef.current.play().catch(() => {});
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (b) => {
        if (b) {
          setSelfie(b);
          setSelfiePreview(URL.createObjectURL(b));
          detachPreview();
        }
      },
      "image/jpeg",
      0.85,
    );
  };

  const submit = async () => {
    if (!idFile || !selfie || nationalId.trim().length < 4) return;
    setSubmitting(true);
    setErr("");
    try {
      const [idPath, selfiePath] = await Promise.all([
        uploadIdImage({ supabase, blob: idFile, userId, attemptId, kind: "id" }),
        uploadIdImage({ supabase, blob: selfie, userId, attemptId, kind: "selfie" }),
      ]);
      const res = await saveIdVerification(attemptId, { idPath, selfiePath, nationalId: nationalId.trim() });
      if (res?.error) {
        setErr(res.error);
        setSubmitting(false);
        return;
      }
      onDone();
    } catch {
      setErr("Upload failed. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-14">
      <div className="text-center">
        <p className="eyebrow">Identity check</p>
        <h1 className="font-serif-display mt-3 text-3xl text-charcoal">
          Verify your identity
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Upload a photo of your government ID and take a quick selfie. A proctor
          compares them before your result is released. This step is required.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-sm">
        <label htmlFor="national-id" className="mb-1 block text-sm font-medium text-charcoal">
          National ID
        </label>
        <input
          id="national-id"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Your National ID"
          className="w-full rounded-md border border-gold/30 bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Appears as your Candidate ID on the certificate. Required.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {/* ID upload */}
        <div className="rounded-xl border border-gold/25 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
            <IdCard className="size-4 text-gold" /> Photo of your ID
          </p>
          {idPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={idPreview} alt="ID preview" className="aspect-video w-full rounded-lg object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-charcoal/5 text-xs text-muted-foreground">
              No file selected
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onId}
            className="mt-3 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-charcoal"
          />
        </div>

        {/* Selfie */}
        <div className="rounded-xl border border-gold/25 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
            <Camera className="size-4 text-gold" /> Selfie
          </p>
          {selfiePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selfiePreview} alt="Selfie preview" className="aspect-video w-full rounded-lg object-cover" />
          ) : (
            <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-lg bg-charcoal/80 object-cover" />
          )}
          <div className="mt-3 flex gap-2">
            {!selfiePreview && !camOn && (
              <Button type="button" size="sm" variant="outline" onClick={enableCam}>
                <Camera className="size-4" /> Enable camera
              </Button>
            )}
            {camOn && (
              <Button type="button" size="sm" variant="gold" onClick={capture}>
                Take selfie
              </Button>
            )}
            {selfiePreview && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelfie(null);
                  setSelfiePreview("");
                }}
              >
                Retake
              </Button>
            )}
          </div>
        </div>
      </div>

      {err && <p className="mt-4 text-center text-sm text-red-600">{err}</p>}

      <div className="mt-8 flex justify-center">
        <Button
          type="button"
          variant="gold"
          size="lg"
          disabled={!idFile || !selfie || nationalId.trim().length < 4 || submitting}
          onClick={submit}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {submitting ? "Saving…" : "Submit & continue"}
        </Button>
      </div>
    </div>
  );
}
