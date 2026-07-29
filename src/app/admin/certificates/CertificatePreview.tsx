"use client";

import * as React from "react";
import { Eye, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Admin certificate viewer: renders a live sample of the real certificate
 * (through the actual generator) inline for the chosen level, so admins can
 * review the exact design without needing a real graduate. Also opens it
 * full-size in a new tab.
 */
export function CertificatePreview() {
  const [level, setLevel] = React.useState(3);
  const [open, setOpen] = React.useState(false);
  const src = `/api/admin/certificate-preview?level=${level}`;

  return (
    <div className="mb-6 rounded-xl border border-gold/20 bg-white/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-charcoal">Certificate preview</span>
        <label className="text-sm text-muted-foreground" htmlFor="cert-preview-level">
          Level
        </label>
        <select
          id="cert-preview-level"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="rounded-md border border-gold/25 bg-background px-2 py-1.5 text-sm"
        >
          {[1, 2, 3, 4, 5].map((l) => (
            <option key={l} value={l}>
              LBE {l}
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Eye className="size-4" /> {open ? "Hide" : "View certificate"}
        </Button>
        <a href={src} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="ghost">
            <ExternalLink className="size-4" /> Open in new tab
          </Button>
        </a>
      </div>

      {open && (
        <iframe
          key={src}
          title={`Certificate preview LBE ${level}`}
          src={src}
          className="mt-4 h-[860px] w-full rounded-lg border border-gold/25 bg-white shadow-card"
        />
      )}
    </div>
  );
}
