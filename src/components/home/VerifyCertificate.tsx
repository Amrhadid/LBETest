"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search } from "lucide-react";

import { Section } from "@/components/Section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function VerifyCertificate() {
  const router = useRouter();
  const [code, setCode] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    // Wired to the stub /verify route for now — no backend call yet.
    router.push(trimmed ? `/verify?code=${encodeURIComponent(trimmed)}` : "/verify");
  }

  return (
    <Section id="verify">
      <div className="relative overflow-hidden rounded-3xl border border-teal/25 bg-gradient-to-br from-[rgb(var(--surface))] to-teal/5 p-8 sm:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-teal/12 text-teal">
            <ShieldCheck className="size-6" />
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Verify a certificate
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Hiring or checking a candidate? Enter a certificate ID to confirm
            it’s authentic and see the level it certifies.
          </p>

          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label htmlFor="cert-id" className="sr-only">
                Certificate ID
              </label>
              <Input
                id="cert-id"
                name="code"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. LBET-2026-8F3A-QK2"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 tabular-nums"
              />
            </div>
            <Button type="submit" variant="teal" size="md">
              Verify
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Every LBET certificate carries a unique, tamper-evident ID.
          </p>
        </div>
      </div>
    </Section>
  );
}
