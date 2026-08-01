"use client";

import * as React from "react";
import { Sparkles, Loader2, RefreshCw, Download, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CURRENT_STATUSES,
  TONES,
  EXPERIENCE_SUGGESTIONS,
  SOFT_SKILL_SUGGESTIONS,
  QUALIFICATION_SUGGESTIONS,
  WEAKNESS_SUGGESTIONS,
  type IntroData,
} from "@/lib/training/intro";

/* ---------------- chip multi-select (choose from list or add your own) ------ */

function ChipSelect({
  label,
  suggestions,
  value,
  onChange,
}: {
  label: string;
  suggestions: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [custom, setCustom] = React.useState("");
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const add = () => {
    const v = custom.trim();
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) {
      onChange([...value, v]);
    }
    setCustom("");
  };
  const extras = value.filter(
    (v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase()),
  );

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const on = value.some((x) => x.toLowerCase() === s.toLowerCase());
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={on}
              className={
                "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                (on
                  ? "border-gold bg-gold/15 font-medium text-charcoal"
                  : "border-gold/25 text-muted-foreground hover:bg-gold/8")
              }
            >
              {s}
            </button>
          );
        })}
        {extras.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full border border-gold bg-gold/15 px-3 py-1.5 text-sm font-medium text-charcoal"
          >
            {s}
            <button type="button" onClick={() => toggle(s)} aria-label={`Remove ${s}`}>
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add your own…"
          className="max-w-xs"
        />
        <Button type="button" variant="outline" size="md" onClick={add} disabled={!custom.trim()}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  "w-full rounded-lg border border-gold/25 bg-background px-3 py-2.5 text-sm";

/* --------------------------------- main ------------------------------------- */

export function IntroduceYourself({
  initial,
  savedText,
}: {
  initial: IntroData;
  savedText: string | null;
}) {
  const [d, setD] = React.useState<IntroData>(initial);
  const [result, setResult] = React.useState<string | null>(savedText);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof IntroData>(k: K, v: IntroData[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const generate = async () => {
    setError(null);
    if (!d.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/training/material/introduce-yourself/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(d),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !json.text) {
        setError(json.error ?? `Generation failed (${res.status}).`);
      } else {
        setResult(json.text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]); // US Letter
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const body = await pdf.embedFont(StandardFonts.Helvetica);
    const margin = 64;
    const width = 612 - margin * 2;
    let y = 792 - margin;

    const gold = rgb(0.61, 0.48, 0.12);
    const ink = rgb(0.16, 0.15, 0.13);

    page.drawText("Self-introduction", { x: margin, y, size: 11, font: bold, color: gold });
    y -= 26;
    page.drawText(d.name || "Candidate", { x: margin, y, size: 22, font: bold, color: ink });
    y -= 16;
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + width, y },
      thickness: 1,
      color: rgb(0.85, 0.8, 0.68),
    });
    y -= 28;

    // Word-wrap the generated text at the page width.
    const size = 12;
    const lineHeight = 18;
    for (const paragraph of result.split(/\n+/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const trial = line ? `${line} ${word}` : word;
        if (body.widthOfTextAtSize(trial, size) > width && line) {
          page.drawText(line, { x: margin, y, size, font: body, color: ink });
          y -= lineHeight;
          line = word;
        } else {
          line = trial;
        }
      }
      if (line) {
        page.drawText(line, { x: margin, y, size, font: body, color: ink });
        y -= lineHeight;
      }
      y -= 8;
    }

    const bytes = await pdf.save();
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (d.name || "introduction").replace(/[^\w-]+/g, "_");
    a.href = url;
    a.download = `${safe}_introduction.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 rounded-2xl border border-gold/25 bg-card p-6 shadow-card sm:grid-cols-2">
        <Field label="Name">
          <Input value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" />
        </Field>
        <Field label="Date of birth">
          <Input type="date" value={d.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
        </Field>
        <Field label="City of residence">
          <Input value={d.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Cairo" />
        </Field>
        <Field label="Education">
          <Input value={d.education} onChange={(e) => set("education", e.target.value)} placeholder="e.g. BSc Computer Science" />
        </Field>
        <Field label="Current status">
          <select className={selectCls} value={d.current_status} onChange={(e) => set("current_status", e.target.value)}>
            <option value="">Select…</option>
            {CURRENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Previous job (if any)">
          <Input value={d.previous_job} onChange={(e) => set("previous_job", e.target.value)} placeholder="e.g. Support Specialist" />
        </Field>
        <Field label="Field / industry">
          <Input value={d.field} onChange={(e) => set("field", e.target.value)} placeholder="e.g. Fintech" />
        </Field>
        <Field label="Languages spoken">
          <Input value={d.languages} onChange={(e) => set("languages", e.target.value)} placeholder="e.g. Arabic, English, French" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Career goal — what you're looking for next">
            <Input value={d.career_goal} onChange={(e) => set("career_goal", e.target.value)} placeholder="e.g. A project coordinator role in a global team" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="One key achievement">
            <Input value={d.key_achievement} onChange={(e) => set("key_achievement", e.target.value)} placeholder="e.g. Led a team that cut response times by 30%" />
          </Field>
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
        <ChipSelect label="Experience areas" suggestions={EXPERIENCE_SUGGESTIONS} value={d.experience_areas} onChange={(v) => set("experience_areas", v)} />
        <ChipSelect label="Soft skills / qualities" suggestions={SOFT_SKILL_SUGGESTIONS} value={d.soft_skills} onChange={(v) => set("soft_skills", v)} />
        <ChipSelect label="Qualifications" suggestions={QUALIFICATION_SUGGESTIONS} value={d.qualifications} onChange={(v) => set("qualifications", v)} />
        <ChipSelect label="Areas for improvement" suggestions={WEAKNESS_SUGGESTIONS} value={d.weaknesses} onChange={(v) => set("weaknesses", v)} />
      </div>

      <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
        <span className="mb-2 block text-sm font-medium text-charcoal">Tone</span>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set("tone", t.value)}
              aria-pressed={d.tone === t.value}
              className={
                "rounded-full border px-4 py-2 text-sm transition-colors " +
                (d.tone === t.value
                  ? "border-gold bg-gold/15 font-medium text-charcoal"
                  : "border-gold/25 text-muted-foreground hover:bg-gold/8")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" variant="gold" size="lg" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? "Writing…" : result ? "Regenerate" : "Generate introduction"}
          </Button>
          {error && <span className="text-sm text-rose-700">{error}</span>}
        </div>
      </div>

      {result && (
        <div className="rounded-2xl border border-border bg-ivory/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif-display text-xl text-charcoal">Your introduction</h3>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={generate} disabled={busy}>
                <RefreshCw className="size-4" /> Regenerate
              </Button>
              <Button type="button" variant="gold" size="sm" onClick={downloadPdf}>
                <Download className="size-4" /> Download as PDF
              </Button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
