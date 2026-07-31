import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ClipboardCheck, Rocket, PlayCircle, Award, Download } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { profileNeedsOnboarding } from "@/lib/auth/onboarding";
import { signOut } from "@/app/login/actions";
import { levelName } from "@/lib/certificates/eligibility";
import { CERTIFICATES_BUCKET } from "@/lib/certificates/finalize";
import { RedeemCard } from "@/app/dashboard/RedeemCard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your LBET account dashboard.",
};

export const dynamic = "force-dynamic";

function attemptResult(a: { status: string; lbe_level: number | null }): {
  label: string;
  tone: "muted" | "gold" | "pending";
} {
  if (a.status === "in_progress") return { label: "In progress", tone: "pending" };
  if (a.status === "submitted") return { label: "Awaiting results", tone: "pending" };
  if (a.status === "scored") {
    return a.lbe_level && a.lbe_level >= 1
      ? { label: `LBE ${a.lbe_level} — ${levelName(a.lbe_level)}`, tone: "gold" }
      : { label: "Not yet certified", tone: "muted" };
  }
  return { label: a.status, tone: "muted" };
}

export default async function DashboardPage() {
  let user: { id: string; email?: string } | null = null;
  let profile: {
    full_name: string | null;
    role: string | null;
    onboarded_at: string | null;
  } | null = null;
  const supabase = await createClient();
  try {
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, onboarded_at")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
  } catch {
    user = null;
  }
  if (!user) redirect("/login");
  // First-time candidates must complete onboarding before the dashboard.
  if (profileNeedsOnboarding(profile)) redirect("/onboarding?next=/dashboard");

  const displayName = profile?.full_name ?? user.email ?? "there";

  // Own attempts (RLS scopes to this user), excluding preview runs.
  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, exam_id, status, submitted_at, created_at, lbe_level, access_code_id")
    .eq("is_preview", false)
    .order("created_at", { ascending: false });

  const { data: certs } = await supabase
    .from("certificates")
    .select("id, cert_code, lbe_level, status, issued_at, expires_at, pdf_url")
    .order("issued_at", { ascending: false });

  // Exam titles (candidates can't read exams via RLS → service role) + signed
  // URLs for the user's own certificate PDFs.
  const svc = createServiceRoleClient();
  const examIds = [...new Set((attempts ?? []).map((a) => a.exam_id).filter(Boolean))] as string[];
  const examTitles = new Map<string, string>();
  if (examIds.length) {
    const { data: exams } = await svc.from("exams").select("id, title").in("id", examIds);
    for (const e of exams ?? []) examTitles.set(e.id, e.title ?? "LBE exam");
  }
  const pdfUrls = new Map<string, string>();
  await Promise.all(
    (certs ?? [])
      .filter((c) => c.pdf_url)
      .map(async (c) => {
        const { data } = await svc.storage
          .from(CERTIFICATES_BUCKET)
          .createSignedUrl(c.pdf_url as string, 60 * 30);
        if (data?.signedUrl) pdfUrls.set(c.id, data.signedUrl);
      }),
  );

  const inProgress = (attempts ?? []).find((a) => a.status === "in_progress");

  // Entitlement: a redeemed code not yet consumed by an attempt.
  const { data: codes } = await supabase
    .from("access_codes")
    .select("id")
    .eq("redeemed_by", user.id)
    .eq("status", "used");
  const consumed = new Set((attempts ?? []).map((a) => a.access_code_id).filter(Boolean));
  const canStart = (codes ?? []).some((c) => !consumed.has(c.id));

  const isStaff = ["teacher", "admin"].includes(profile?.role ?? "");

  return (
    <PageShell>
      <Section>
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1 className="font-serif-display mt-2 text-4xl text-charcoal sm:text-5xl">
                Welcome, {displayName}
              </h1>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="md">
                <LogOut className="size-4" /> Sign out
              </Button>
            </form>
          </div>

          {isStaff && (
            <div className="mt-8">
              <Link href="/admin">
                <Button variant="outline" size="md">
                  <ClipboardCheck className="size-4" /> Admin dashboard
                </Button>
              </Link>
            </div>
          )}

          {/* Take / resume / redeem */}
          <div className="mt-10">
            {inProgress ? (
              <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
                <div className="mb-2 flex items-center gap-2 text-gold">
                  <PlayCircle className="size-5" />
                  <h3 className="text-lg font-semibold text-charcoal">You have an exam in progress</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">Pick up where you left off.</p>
                <Link href="/start"><Button variant="gold" size="md">Resume exam</Button></Link>
              </div>
            ) : canStart ? (
              <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card">
                <div className="mb-2 flex items-center gap-2 text-gold">
                  <Rocket className="size-5" />
                  <h3 className="text-lg font-semibold text-charcoal">You&rsquo;re ready to begin</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">Your access code is redeemed. Start when you&rsquo;re ready.</p>
                <Link href="/start"><Button variant="gold" size="md">Go to your exam</Button></Link>
              </div>
            ) : (
              <RedeemCard />
            )}
          </div>

          {/* Attempt history */}
          <div className="mt-10">
            <h2 className="font-serif-display text-2xl text-charcoal">Your attempts</h2>
            {(attempts ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No attempts yet. Redeem an access code above to take your first test.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-gold/15 bg-card">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
                      <th className="p-3">Exam</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(attempts ?? []).map((a) => {
                      const res = attemptResult(a);
                      return (
                        <tr key={a.id} className="border-b border-gold/10 last:border-0">
                          <td className="p-3">{examTitles.get(a.exam_id ?? "") ?? "LBE exam"}</td>
                          <td className="p-3 text-muted-foreground">
                            {(a.submitted_at ?? a.created_at ?? "").slice(0, 10)}
                          </td>
                          <td className="p-3 capitalize text-muted-foreground">{a.status.replace("_", " ")}</td>
                          <td className="p-3">
                            <span className={
                              res.tone === "gold" ? "font-medium text-charcoal"
                              : res.tone === "pending" ? "text-amber-700"
                              : "text-muted-foreground"
                            }>
                              {res.label}
                            </span>
                            {a.status === "in_progress" && (
                              <Link href="/start" className="ml-3 text-xs text-gold underline-offset-4 hover:underline">Resume</Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Certificates */}
          <div className="mt-10">
            <h2 className="font-serif-display text-2xl text-charcoal">Your certificates</h2>
            {(certs ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Certificates you earn (LBE 1 and above) will appear here.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(certs ?? []).map((c) => {
                  const revoked = c.status === "revoked";
                  const expired = c.status === "expired" || (c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false);
                  return (
                    <Card key={c.id}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 font-medium text-charcoal">
                            <Award className="size-4 text-gold" />
                            LBE {c.lbe_level} — {c.lbe_level ? levelName(c.lbe_level) : ""}
                          </span>
                          {revoked ? (
                            <span className="text-xs font-semibold text-rose-700">Revoked</span>
                          ) : expired ? (
                            <span className="text-xs font-semibold text-amber-700">Expired</span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700">Valid</span>
                          )}
                        </div>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">{c.cert_code}</p>
                        <p className="text-xs text-muted-foreground">Issued {(c.issued_at ?? "").slice(0, 10)}</p>
                        <div className="mt-4 flex gap-3">
                          {pdfUrls.get(c.id) && !revoked ? (
                            <a href={pdfUrls.get(c.id)} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm"><Download className="size-4" /> View / download PDF</Button>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {revoked ? "PDF unavailable (revoked)" : "PDF not available"}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Account */}
          <div className="mt-10">
            <Card>
              <CardHeader><CardTitle>Your account</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-charcoal">Email:</span> {user.email}</p>
                <p><span className="font-medium text-charcoal">Role:</span> {profile?.role ?? "candidate"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
