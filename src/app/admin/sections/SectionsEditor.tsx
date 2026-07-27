"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateExamConfig } from "@/app/admin/actions";

const LEVELS = [1, 2, 3, 4, 5];
const LEVEL_NAMES: Record<number, string> = {
  1: "Foundation", 2: "Operational", 3: "Professional",
  4: "Advanced Professional", 5: "Executive",
};

interface SectionCfg { seconds?: number; weight?: number }

export function SectionsEditor({
  examId,
  defaultSeconds,
  sections,
}: {
  examId: string;
  defaultSeconds: number;
  sections: Record<string, SectionCfg>;
}) {
  const [globalMin, setGlobalMin] = React.useState(String(Math.round(defaultSeconds / 60)));
  const [rows, setRows] = React.useState<Record<number, { min: string; weight: string }>>(
    () => {
      const r: Record<number, { min: string; weight: string }> = {};
      for (const l of LEVELS) {
        const s = sections[String(l)] ?? {};
        r[l] = {
          min: s.seconds ? String(Math.round(s.seconds / 60)) : "",
          weight: s.weight != null ? String(s.weight) : "1",
        };
      }
      return r;
    },
  );
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);

  const save = () =>
    start(async () => {
      setMsg(null);
      const sectionsCfg: Record<string, SectionCfg> = {};
      for (const l of LEVELS) {
        const cfg: SectionCfg = {};
        const min = Number(rows[l].min);
        if (Number.isFinite(min) && min > 0) cfg.seconds = Math.round(min * 60);
        const w = Number(rows[l].weight);
        if (Number.isFinite(w)) cfg.weight = w;
        sectionsCfg[String(l)] = cfg;
      }
      const seconds = Math.max(1, Number(globalMin) || 12) * 60;
      const res = await updateExamConfig(examId, {
        section_seconds: seconds,
        sections: sectionsCfg,
      });
      setMsg(res.error ?? res.message ?? null);
    });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gold/15 bg-card p-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-charcoal">
            Default time per section (minutes)
          </span>
          <span className="mb-2 block text-xs text-muted-foreground">
            Used by the exam runner for every section unless overridden below.
          </span>
          <Input
            type="number"
            min={1}
            value={globalMin}
            onChange={(e) => setGlobalMin(e.target.value)}
            className="w-32"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gold/15 bg-card">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">Section</th>
              <th className="p-3">Time override (min)</th>
              <th className="p-3">Weight</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l) => (
              <tr key={l} className="border-b border-gold/10 last:border-0">
                <td className="p-3">
                  <span className="font-medium">Section {l}</span>
                  <span className="ml-2 text-muted-foreground">LBE {l} · {LEVEL_NAMES[l]}</span>
                </td>
                <td className="p-3">
                  <Input
                    type="number" min={1} placeholder="default"
                    value={rows[l].min}
                    onChange={(e) => setRows((p) => ({ ...p, [l]: { ...p[l], min: e.target.value } }))}
                    className="w-28"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="number" min={0} step="0.1"
                    value={rows[l].weight}
                    onChange={(e) => setRows((p) => ({ ...p, [l]: { ...p[l], weight: e.target.value } }))}
                    className="w-24"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save settings
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        Note: the exam runner currently applies the default section time to all
        sections. Per-section time overrides and weights are stored on the exam
        config and will be honored once section-weighted scoring ships.
      </p>
    </div>
  );
}
