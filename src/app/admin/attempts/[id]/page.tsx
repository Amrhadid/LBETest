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
import { TrustBadge } from "@/app/admin/attempts/TrustBadge";
import { RecomputeTrustButton } from "@/app/admin/attempts/[id]/RecomputeTrustButton";
import { findDuplicateAnswers } from "@/lib/exam/trust.server";
import {
  ROOM_SCAN_BUCKET,
  ID_VERIFICATION_BUCKET,
  ATTEMPT_RECORDINGS_BUCKET,
  recordingPrefix,
  type RecordingKind,
} from "@/lib/exam/storage";
import { ReviewControls } from "@/app/admin/attempts/[id]/ReviewControls";

const TRUST_LABELS: Record<string, string> = {
  tabBlur: "Left the tab / window",
  fullscreenExit: "Exited fullscreen",
  violations: "Recorded violations",
  fastSections: "Sections finished implausibly fast",
  duplicateAnswers: "Answers near-identical to other candidates",
  datacenter: "Datacenter / hosting IP",
  sharedFingerprint: "Device fingerprint shared with others",
};

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
    .select("id, user_id, exam_id, status, final_score, lbe_level, is_preview, started_at, submitted_at, created_at, access_code_id, trust_score, trust_breakdown, country, network, asn, is_datacenter, fingerprint, room_scan_path, violation_count, id_verified, id_image_path, selfie_path, has_webcam_rec, has_mic_rec, has_screen_rec, no_face_count, multi_face_count, multi_speaker, review_status, review_note, reviewed_by, reviewed_at")
    .eq("id", id)
    .maybeSingle();

  if (!attempt) notFound();

  const [{ data: events }, { data: responses }, emails, { data: exam }, dups] =
    await Promise.all([
      svc.from("attempt_events").select("id, type, payload, at").eq("attempt_id", id).order("at", { ascending: true }),
      svc.from("responses").select("id, item_id, grade_status, is_correct").eq("attempt_id", id),
      emailMap(),
      svc.from("exams").select("title").eq("id", attempt.exam_id ?? "").maybeSingle(),
      attempt.is_preview ? Promise.resolve([]) : findDuplicateAnswers(svc, id),
    ]);

  // A real room-scan clip (not the skip marker) gets a short-lived signed URL.
  let roomScanUrl: string | null = null;
  const scanPath = attempt.room_scan_path;
  if (scanPath && !scanPath.endsWith("room-scan-skipped")) {
    const { data: signed } = await svc.storage
      .from(ROOM_SCAN_BUCKET)
      .createSignedUrl(scanPath, 60 * 10);
    roomScanUrl = signed?.signedUrl ?? null;
  }
  const scanSkipped = Boolean(scanPath?.endsWith("room-scan-skipped"));

  // ID + selfie signed URLs (#1) for the manual side-by-side compare.
  const signOne = async (bucket: string, path: string | null) => {
    if (!path) return null;
    const { data } = await svc.storage.from(bucket).createSignedUrl(path, 60 * 10);
    return data?.signedUrl ?? null;
  };
  const [idUrl, selfieUrl] = await Promise.all([
    signOne(ID_VERIFICATION_BUCKET, attempt.id_image_path),
    signOne(ID_VERIFICATION_BUCKET, attempt.selfie_path),
  ]);

  // Continuous recordings (#2/#3/#4): list chunks per kind, sign the first as a
  // playable sample (signing every 30s chunk of a 1-hr attempt is impractical).
  const recKinds: { kind: RecordingKind; present: boolean; label: string }[] = [
    { kind: "webcam", present: Boolean(attempt.has_webcam_rec), label: "Webcam" },
    { kind: "mic", present: Boolean(attempt.has_mic_rec), label: "Microphone" },
    { kind: "screen", present: Boolean(attempt.has_screen_rec), label: "Screen" },
  ];
  const recordings = await Promise.all(
    recKinds.map(async (r) => {
      if (!r.present) return { ...r, count: 0, firstUrl: null as string | null };
      const { data: objs } = await svc.storage
        .from(ATTEMPT_RECORDINGS_BUCKET)
        .list(recordingPrefix(attempt.user_id, attempt.id, r.kind), {
          limit: 1000,
          sortBy: { column: "name", order: "asc" },
        });
      const list = objs ?? [];
      const firstUrl = list[0]
        ? await signOne(
            ATTEMPT_RECORDINGS_BUCKET,
            `${recordingPrefix(attempt.user_id, attempt.id, r.kind)}/${list[0].name}`,
          )
        : null;
      return { ...r, count: list.length, firstUrl };
    }),
  );

  const breakdown = (attempt.trust_breakdown ?? {}) as Record<string, number>;
  const breakdownRows = Object.entries(breakdown).filter(([, v]) => Number(v) > 0);

  const blurCount = (events ?? []).filter((e) => e.type === "tab_blur").length;
  const fsExitCount = (events ?? []).filter((e) => e.type === "fullscreen_exit").length;

  // Longest quiet gap between consecutive events — a large gap means the
  // candidate left the attempt open and returned much later.
  const ev = events ?? [];
  let maxGapMs = 0;
  for (let i = 1; i < ev.length; i++) {
    const g = new Date(ev[i].at).getTime() - new Date(ev[i - 1].at).getTime();
    if (g > maxGapMs) maxGapMs = g;
  }
  const maxGapMin = Math.round(maxGapMs / 60000);
  const longGap = maxGapMin >= 30; // 30+ min of inactivity mid-attempt
  const gapLabel =
    maxGapMin >= 60
      ? `${Math.floor(maxGapMin / 60)}h ${maxGapMin % 60}m`
      : `${maxGapMin}m`;
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
        <StatCard label="Longest inactivity" value={ev.length > 1 ? gapLabel : "—"} hint="Quiet gap between events" />
      </div>

      {(blurCount > 0 || fsExitCount > 0 || longGap) && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <Flag className="mt-0.5 size-4 shrink-0" />
          <p>
            {(blurCount > 0 || fsExitCount > 0) && (
              <>
                This candidate left the exam window {blurCount} time{blurCount === 1 ? "" : "s"} and
                exited fullscreen {fsExitCount} time{fsExitCount === 1 ? "" : "s"}.{" "}
              </>
            )}
            {longGap && (
              <>
                There was a <strong>{gapLabel}</strong> gap with no activity — the candidate likely
                left the attempt open and returned later (time is still enforced server-side).{" "}
              </>
            )}
            Review the timeline below.
          </p>
        </div>
      )}

      {/* ---- Exam credibility / trust ------------------------------------ */}
      {!attempt.is_preview && (
        <section className="mt-8 rounded-xl border border-gold/20 bg-white/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif-display text-2xl text-charcoal">
              Exam credibility
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Suspicion score:</span>
              <TrustBadge score={attempt.trust_score} />
              <RecomputeTrustButton attemptId={attempt.id} />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Composite of all signals below. Higher = more suspicious. Admin-only —
            never shown to the candidate.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Origin"
              value={attempt.country ?? "Unknown"}
              hint={attempt.is_datacenter ? "Datacenter / hosting IP" : (attempt.network ?? "—")}
            />
            <StatCard
              label="Network (ASN)"
              value={attempt.asn ? `AS${attempt.asn}` : "—"}
              hint={attempt.network ?? undefined}
            />
            <StatCard
              label="Device fingerprint"
              value={attempt.fingerprint ? attempt.fingerprint.slice(0, 10) : "—"}
              hint={attempt.fingerprint ? "Flagged if shared across candidates" : "Not captured"}
            />
          </div>

          {/* Score breakdown */}
          {breakdownRows.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-charcoal">Score breakdown</p>
              <ul className="space-y-1 text-sm">
                {breakdownRows.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between rounded border border-gold/10 px-3 py-1.5">
                    <span className="text-muted-foreground">{TRUST_LABELS[k] ?? k}</span>
                    <span className="font-semibold tabular-nums text-amber-800">+{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {attempt.trust_score == null
                ? "Not yet scored — recompute to generate the breakdown."
                : "No suspicious signals contributed to the score."}
            </p>
          )}

          {/* Duplicate-answer findings (#3) */}
          {dups.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-charcoal">
                Duplicate open-ended answers ({dups.length})
              </p>
              <ul className="space-y-1 text-sm">
                {dups.map((d, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-red-800">
                    <span className="font-mono text-xs">item {d.itemId.slice(0, 8)}</span>
                    <span>{Math.round(d.similarity * 100)}% similar to{" "}
                      <Link href={`/admin/attempts/${d.otherAttemptId}`} className="underline">
                        another attempt
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ID + selfie (#1): manual side-by-side compare */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-charcoal">
              Identity verification{" "}
              {attempt.id_verified ? (
                <span className="text-emerald-700">✓ submitted</span>
              ) : (
                <span className="text-red-700">✗ not completed</span>
              )}
            </p>
            {(idUrl || selfieUrl) ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <figure>
                  <figcaption className="mb-1 text-xs text-muted-foreground">ID document</figcaption>
                  {idUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={idUrl} alt="ID document" className="w-full rounded-lg border border-gold/20" />
                  ) : <p className="text-xs text-muted-foreground">—</p>}
                </figure>
                <figure>
                  <figcaption className="mb-1 text-xs text-muted-foreground">Selfie</figcaption>
                  {selfieUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selfieUrl} alt="Selfie" className="w-full rounded-lg border border-gold/20" />
                  ) : <p className="text-xs text-muted-foreground">—</p>}
                </figure>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ID/selfie captured.</p>
            )}
          </div>

          {/* Continuous recordings (#2/#3/#4) */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-charcoal">Continuous recordings</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {recordings.map((r) => (
                <div key={r.kind} className="rounded-lg border border-gold/15 p-3">
                  <p className="text-sm font-medium text-charcoal">{r.label}</p>
                  {r.present ? (
                    <>
                      <p className="text-xs text-muted-foreground">{r.count} segment{r.count === 1 ? "" : "s"}</p>
                      {r.firstUrl && (
                        r.kind === "mic" ? (
                          <audio src={r.firstUrl} controls className="mt-2 w-full" />
                        ) : (
                          <video src={r.firstUrl} controls className="mt-2 w-full rounded border border-gold/20" />
                        )
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">First segment shown; all segments in storage.</p>
                    </>
                  ) : (
                    <p className="text-xs text-amber-700">Not recorded (declined or unavailable).</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Room scan (#6) */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-charcoal">Room scan</p>
            {roomScanUrl ? (
              <video src={roomScanUrl} controls className="max-w-md rounded-lg border border-gold/20" />
            ) : scanSkipped ? (
              <p className="text-sm text-amber-700">Candidate skipped the room scan (no camera).</p>
            ) : (
              <p className="text-sm text-muted-foreground">No room scan recorded.</p>
            )}
          </div>

          {/* Human review workflow (#8) */}
          <ReviewControls
            attemptId={attempt.id}
            current={attempt.review_status}
            note={attempt.review_note}
            reviewer={attempt.reviewed_by}
            reviewedAt={attempt.reviewed_at}
          />
        </section>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Grades pending / failed" value={`${pending} / ${failed}`} />
      </div>

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
