"use client";

import * as React from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Loader2, X, Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CERT_PHOTO_ASPECT } from "@/lib/certificates/photoBox";
import { getCroppedImageBlob, type CropPixels } from "@/lib/certificates/cropImage";

/**
 * Facebook-style "select → drag/zoom to crop → confirm" flow for the
 * certificate photo. Crop is locked to the certificate's photo-box aspect
 * ratio; after cropping, the result is shown inside a box shaped exactly
 * like the certificate's photo frame so the candidate confirms the same
 * thing that will appear on their certificate before it uploads.
 */
export function PhotoCropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
}) {
  const [step, setStep] = React.useState<"crop" | "confirm">("crop");
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedPixels, setCroppedPixels] = React.useState<CropPixels | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onCropComplete = React.useCallback((_area: Area, areaPixels: Area) => {
    setCroppedPixels(areaPixels);
  }, []);

  const goToConfirm = async () => {
    if (!croppedPixels) return;
    setError(null);
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedPixels);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setStep("confirm");
    } catch {
      setError("Could not process that image. Try a different photo.");
    } finally {
      setBusy(false);
    }
  };

  const confirmUpload = async () => {
    if (!croppedPixels) return;
    setError(null);
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedPixels);
      await onConfirm(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-dark/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">
              {step === "crop" ? "Position your photo" : "Confirm your photo"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "crop"
                ? "Drag to reposition, use the slider to zoom. This is exactly how it will be framed on your certificate."
                : "This is exactly how your photo will appear on your certificate."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground hover:bg-gold/8 hover:text-charcoal"
            aria-label="Cancel"
          >
            <X className="size-5" />
          </button>
        </div>

        {step === "crop" ? (
          <>
            <div className="relative mt-4 h-80 w-full overflow-hidden rounded-xl bg-charcoal-dark/90">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={CERT_PHOTO_ASPECT}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>
            {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" variant="gold" size="sm" onClick={goToConfirm} disabled={busy || !croppedPixels}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-5 flex justify-center">
              <div
                className="overflow-hidden rounded-xl border border-gold/30 bg-muted/40 shadow-card"
                style={{ width: 200, height: Math.round(200 / CERT_PHOTO_ASPECT) }}
              >
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Certificate photo preview" className="size-full object-cover" />
                )}
              </div>
            </div>
            {error && <p className="mt-3 text-center text-sm text-rose-700">{error}</p>}
            <div className="mt-5 flex justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep("crop")} disabled={busy}>
                <RotateCcw className="size-4" /> Re-crop
              </Button>
              <Button type="button" variant="gold" size="sm" onClick={confirmUpload} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Use this photo
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
