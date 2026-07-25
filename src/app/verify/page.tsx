import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldQuestion, Search } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description:
    "Confirm that a Locrativ Business English (LBE) certificate is authentic and see the LBE level it certifies.",
};

// NOTE: stub route. No backend call yet — this renders a clear "not connected"
// state so the Verify flow is navigable without fabricating a result.
// TODO(backend): wire the certificate-verification API here and render the
// polished result state (verified, candidate name, LBE score, qualification,
// issue date, certificate ID) for valid IDs, and an accessible error state
// for invalid ones.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const query = (code ?? "").trim();
  const hasQuery = query.length > 0;

  return (
    <PageShell>
      <Section>
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
              <ShieldCheck className="size-6" />
            </span>
            <h1 className="font-serif-display mt-5 text-4xl text-charcoal sm:text-5xl">
              Verify a certificate
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Enter a certificate ID to confirm it&rsquo;s authentic.
            </p>
          </div>

          <form
            action="/verify"
            method="get"
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label htmlFor="code" className="sr-only">
                Certificate ID
              </label>
              <Input
                id="code"
                name="code"
                defaultValue={query}
                placeholder="e.g. LBE-2026-000184"
                className="pl-10 tabular-nums"
              />
            </div>
            <Button type="submit" variant="gold">
              Verify Certificate
            </Button>
          </form>

          {hasQuery && (
            <Card className="mx-auto mt-8 max-w-lg p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-gold">
                  <ShieldQuestion className="size-6" />
                </span>
                <div>
                  <p className="font-semibold text-charcoal">
                    Verification is not connected yet
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    You searched for{" "}
                    <span className="font-mono font-medium text-charcoal">
                      {query}
                    </span>
                    . Certificate lookup will be wired to the verification
                    backend in a later milestone.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="rounded-sm font-medium text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </Section>
    </PageShell>
  );
}
