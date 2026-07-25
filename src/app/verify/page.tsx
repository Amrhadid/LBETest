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
    "Confirm that an LBET Business English certificate is authentic and see the level it certifies.",
};

// NOTE: stub route. No backend call yet — this renders a placeholder result
// so the Verify flow is navigable. Real validation plugs into Supabase later.
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
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-teal/12 text-teal">
              <ShieldCheck className="size-6" />
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Verify a certificate
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Enter a certificate ID to confirm it’s authentic.
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
                placeholder="e.g. LBET-2026-8F3A-QK2"
                className="pl-10 tabular-nums"
              />
            </div>
            <Button type="submit" variant="teal">
              Verify
            </Button>
          </form>

          {hasQuery && (
            <Card className="mx-auto mt-8 max-w-lg p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning">
                  <ShieldQuestion className="size-6" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    Verification is not connected yet
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    You searched for{" "}
                    <span className="font-mono font-medium text-foreground">
                      {query}
                    </span>
                    . This is a preview of the LBET homepage — certificate
                    lookup will be wired to the backend (Supabase) in a later
                    milestone.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-primary-mid hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </Section>
    </PageShell>
  );
}
