"use client";

import * as React from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Admin certificate preview: opens a live sample certificate PDF (rendered
 * through the real generator) in a new tab, for the chosen level. Lets an admin
 * QA the certificate design without needing a real graduate.
 */
export function CertificatePreview() {
  const [level, setLevel] = React.useState(3);

  return (
    <div className="flex items-center gap-2">
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
      <a
        href={`/api/admin/certificate-preview?level=${level}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="sm" variant="outline">
          <Eye className="size-4" /> Preview certificate
        </Button>
      </a>
    </div>
  );
}
