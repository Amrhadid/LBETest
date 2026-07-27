import Link from "next/link";
import {
  ShieldCheck, ShieldAlert, ShieldX, Search, Award, CheckCircle2,
  XCircle, Clock, HelpCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { verifyCertificate, type VerifyResult } from "@/lib/certificates/verify";

const STYLES: Record<
  VerifyResult["status"],
  { icon: React.ElementType; ring: string; text: string; label: string }
> = {
  valid: { icon: CheckCircle2, ring: "border-emerald-300 bg-emerald-50 text-emerald-700", text: "text-emerald-800", label: "Valid certificate" },
  revoked: { icon: XCircle, ring: "border-rose-300 bg-rose-50 text-rose-700", text: "text-rose-800", label: "Certificate revoked" },
  expired: { icon: Clock, ring: "border-amber-300 bg-amber-50 text-amber-700", text: "text-amber-800", label: "Certificate expired" },
  not_found: { icon: HelpCircle, ring: "border-gold/30 bg-gold/8 text-charcoal", text: "text-charcoal", label: "No certificate found" },
  invalid: { icon: ShieldX, ring: "border-rose-300 bg-rose-50 text-rose-700", text: "text-rose-800", label: "Could not be verified" },
};

function ResultCard({ result }: { result: VerifyResult }) {
  const s = STYLES[result.status];
  const Icon = s.icon;
  const showDetails = result.status === "valid" || result.status === "expired" || result.status === "revoked";

  return (
    <Card className="mx-auto mt-8 max-w-lg overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gold/10 p-5">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${s.ring}`}>
          <Icon className="size-6" />
        </span>
        <div>
          <p className={`font-semibold ${s.text}`}>{s.label}</p>
          <p className="font-mono text-xs text-muted-foreground">{result.code}</p>
        </div>
      </div>

      <div className="p-5">
        {result.status === "not_found" && (
          <p className="text-sm text-muted-foreground">
            No Locrativ Business English certificate matches this code. Check the
            code and try again.
          </p>
        )}
        {result.status === "invalid" && (
          <p className="text-sm text-muted-foreground">
            This certificate could not be authenticated. Its details may have
            been altered — treat it as not genuine.
          </p>
        )}
        {result.status === "revoked" && (
          <p className="mb-4 text-sm text-rose-700">
            This certificate has been revoked by Locrativ and is no longer valid.
          </p>
        )}
        {result.status === "expired" && (
          <p className="mb-4 text-sm text-amber-700">
            This certificate has expired{result.expiresAt ? ` (on ${result.expiresAt})` : ""}.
          </p>
        )}

        {showDetails && (
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Certificate holder</dt>
              <dd className="font-medium text-charcoal">{result.candidateName}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Level</dt>
              <dd className="flex items-center gap-2 font-medium text-charcoal">
                <Award className="size-4 text-gold" />
                LBE {result.level} — {result.levelName}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Issued</dt>
              <dd className="font-medium text-charcoal">{result.issuedAt ?? "—"}</dd>
            </div>
          </dl>
        )}
      </div>
    </Card>
  );
}

export async function VerifyView({ code }: { code?: string }) {
  const query = (code ?? "").trim();
  const result = query ? await verifyCertificate(query) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="font-serif-display mt-5 text-4xl text-charcoal sm:text-5xl">
          Verify a certificate
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Enter a certificate code to confirm it&rsquo;s authentic.
        </p>
      </div>

      <form
        action="/verify"
        method="get"
        className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="code" className="sr-only">Certificate code</label>
          <Input
            id="code" name="code" defaultValue={query}
            placeholder="e.g. LBE-3-ABCD2345"
            className="pl-10 uppercase tabular-nums"
          />
        </div>
        <Button type="submit" variant="gold">Verify</Button>
      </form>

      {result && <ResultCard result={result} />}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {result?.status === "valid" ? (
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Authenticity confirmed against Locrativ&rsquo;s records.
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <ShieldAlert className="size-3.5" />
            Every result is checked against a tamper-proof signature.
          </span>
        )}
      </p>

      <p className="mt-6 text-center text-sm">
        <Link href="/" className="font-medium text-gold hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
