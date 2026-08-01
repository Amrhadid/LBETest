import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { hasTrainingAccess } from "@/lib/training/entitlement";
import { TrainingTabs } from "@/app/training/TrainingTabs";

export const dynamic = "force-dynamic";

/**
 * LBE Training shell: Course + Material tabs. Gated by the same entitlement as
 * the exam — a candidate must have redeemed an access code. Signed-out users go
 * to login; entitled users get the tabs and the active lesson.
 */
export default async function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/training");

  const entitled = await hasTrainingAccess(supabase, user.id);

  return (
    <PageShell>
      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">LBE Training</p>
          <h1 className="font-serif-display mt-2 text-4xl text-charcoal sm:text-5xl">
            Training
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Recorded sessions and interactive material to prepare for the LBE Test.
          </p>

          {entitled ? (
            <div className="mt-8">
              <TrainingTabs />
              {children}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-gold/25 bg-card p-6 text-center shadow-card sm:p-8">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
                <KeyRound className="size-6" />
              </span>
              <h2 className="font-serif-display mt-4 text-2xl text-charcoal">
                Training unlocks with your access code
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Once you redeem an LBE access code, the Course and Material tabs
                open up here. Redeem your code to get started.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Button asChild variant="gold" size="md">
                  <Link href="/start">Redeem a code</Link>
                </Button>
                <Button asChild variant="outline" size="md">
                  <Link href="/dashboard">Back to dashboard</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </PageShell>
  );
}
