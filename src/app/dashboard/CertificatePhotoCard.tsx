"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2, Clock, AlertCircle, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

type Status = "none" | "pending" | "approved" | "rejected";

const STATUS_META: Record<
  Exclude<Status, "none">,
  { label: string; cls: string; Icon: React.ElementType }
> = {
  pending: { label: "Pending approval", cls: "bg-amber-100 text-amber-800", Icon: Clock },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
  rejected: { label: "Not approved — please replace", cls: "bg-rose-100 text-rose-800", Icon: AlertCircle },
};

/**
 * Candidate "Certificate Photo" section. Upload a photo to appear on the
 * certificate; an admin approves it. An approved photo is locked.
 */
export function CertificatePhotoCard({
  status,
  photoUrl,
}: {
  status: Status;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const locked = status === "approved";
  const meta = status !== "none" ? STATUS_META[status] : null;

  const onFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/dashboard/certificate-photo", { method: "POST", body: fd });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) setError(json.error ?? "Upload failed.");
      else router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">Certificate photo</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Upload a clear, professional headshot to appear on your certificate.
            An administrator reviews it before it&rsquo;s used. JPG, PNG, or WEBP,
            up to 6&nbsp;MB.
          </p>
        </div>
        {meta && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
            <meta.Icon className="size-3.5" /> {meta.label}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="size-28 overflow-hidden rounded-xl border border-gold/20 bg-muted/40">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Your certificate photo" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>

        <div className="space-y-2">
          {locked ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="size-4" /> Approved and locked. Contact an
              administrator to change it.
            </p>
          ) : (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
              <Button
                type="button"
                variant="gold"
                size="md"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {photoUrl ? "Replace photo" : "Upload photo"}
              </Button>
              {status === "pending" && (
                <p className="text-xs text-muted-foreground">
                  Submitted — waiting for an administrator to approve it.
                </p>
              )}
              {error && <p className="text-sm text-rose-700">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
