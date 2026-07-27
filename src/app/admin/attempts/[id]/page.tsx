import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Eye, EyeOff, Maximize, PlayCircle, CheckCircle2, Flag,
} from "lucide-react";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { levelName } from "@/lib/certificates/eligibility";
import { AdminHeader, StatCard, TableWrap } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Admin — Attempt detail" };

const EVENT_META: Record<
  string,
  { label: string; icon: React.ElementType; integrity: boolean }
> = {
  section_start: { label: "Section started", icon: PlayCircle, integrity: false },
  section_submit: { label: "Section submitted", icon: CheckCircle2, integrity: false },
  attempt_submit: { label: "Attempt submitted", icon: CheckCircle2, integrity: false },
  tab_blur: { label: "Left the tab / window", icon: EyeOff, integrity: true },
  fullscreen_exit: { label: "Exited fullscreen", icon: Maximize, integrity: true },
};

function fmt(d: string | null): string {
  return d ? d.slice(0, 19).replace("T", " ") : "—";
}

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const svc = createServiceRoleClient();

  const { data: attempt } = await svc
    .from("attempts")
    .select("id, user_id, exam_id, status, final_score, lbe_level, is_preview, started_at, submitted_at, created_at, access_code_id")
    .eq("id", id)
    .maybeSingle();

  if (!attempt) notFound();

  const [{ data: events }, { data: responses }, emails, { data: exam }] =
    await Promise.all([
      svc.from("attempt_events").select("id, type, payload, at").eq("attempt_id", id).order("at", { ascending: true }),
      svc.from("responses").select("id, item_id, grade_status, is_correct").eq("attempt_id", id),
      emailMap(),
      svc.from("exams").select("title").eq("id", attempt.exam_id ?? "").maybeSingle(),
    ]);

  const blurCount = (events ?? []).filter((e) => e.type === "tab_blur").length;
  const fsExitCount = (events ?? []).filter((e) => e.type === "fullscreen_exit").length;
  const pending = (responses ?? []).filter((r) => r.grade_status === "pending_approval").length;
  const failed = (responses ?? []).filter((r) => r.grade_status === "failed").length;

  return (
    <div>
      <Link href="/admin/attempts" className="mb-4 inline-flex items-center gap-1 text-sm text-gold underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" /> Back to attempts
      </Link>

      <AdminHeader
        eyebrow="Attempt"
        title={emails.get(attempt.user_id) ?? attempt.user_id.slice(0, 8)}
        description={`${exam?.title ?? "LBE exam"} · attempt ${attempt.id.slice(0, 8)}`}
        actions={
          attempt.is_preview ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-charcoal">
              <Eye className="size-3.5" /> Preview
            </span>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status" value={attempt.status.replace("_", " ")} />
        <StatCard label="Result" value={attempt.lbe_level ? `LBE ${attempt.lbe_level}` : attempt.status === "scored" ? "Not certified" : "—"} hint={attempt.lbe_level ? levelName(attempt.lbe_level) : undefined} />
        <StatCard label="Focus-loss events" value={blurCount + fsExitCount} hint={`${blurCount} tab/window · ${fsExitCount} fullscreen`} />
        <StatCard label="Grades pending / failed" value={`${pending} / ${failed}`} />
      </div>

      {(blurCount > 0 || fsExitCount > 0) && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <Flag className="mt-0.5 size-4 shrink-0" />
          <p>
            This candidate left the exam window {blurCount} time{blurCount === 1 ? "" : "s"} and
            exited fullscreen {fsExitCount} time{fsExitCount === 1 ? "" : "s"}. Review the timeline
            below — repeated focus loss may warrant a closer look.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <p><span className="font-medium text-charcoal">Started:</span> {fmt(attempt.started_at)}</p>
        <p><span className="font-medium text-charcoal">Submitted:</span> {fmt(attempt.submitted_at)}</p>
        <p><span className="font-medium text-charcoal">Responses:</span> {(responses ?? []).length}</p>
      </div>

      <h2 className="font-serif-display mt-10 text-2xl text-charcoal">Event timeline</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Lockdown telemetry recorded during the attempt, in order.
      </p>

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Time</th>
            <th className="p-3">Event</th>
            <th className="p-3">Detail</th>
          </tr>
        </thead>
        <tbody>
          {(events ?? []).map((e) => {
            const meta = EVENT_META[e.type ?? ""] ?? { label: e.type ?? "event", icon: PlayCircle, integrity: false };
            const Icon = meta.icon;
            const payloadStr = e.payload && Object.keys(e.payload as object).length
              ? JSON.stringify(e.payload)
              : "";
            return (
              <tr key={e.id} className="border-b border-gold/10 last:border-0">
                <td className="whitespace-nowrap p-3 tabular-nums text-muted-foreground">{fmt(e.at)}</td>
                <td className="p-3">
                  <span className={"inline-flex items-center gap-2 " + (meta.integrity ? "font-medium text-amber-700" : "text-charcoal")}>
                    <Icon className="size-4" /> {meta.label}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{payloadStr}</td>
              </tr>
            );
          })}
          {(events ?? []).length === 0 && (
            <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No events recorded for this attempt.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
