import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { profileNeedsOnboarding } from "@/lib/auth/onboarding";
import { OnboardingForm } from "@/app/onboarding/OnboardingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete your profile",
  description: "A few quick details before you begin.",
};

/** A safe in-app return path (defaults to /dashboard). */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  const { next } = await searchParams;
  const dest = safeNext(next);

  // Already onboarded (or a staff account that isn't gated) — skip the form.
  if (!profileNeedsOnboarding(profile)) redirect(dest);

  const defaultName = profile?.full_name ?? "";

  return (
    <PageShell>
      <Section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-8 text-center">
            <p className="eyebrow">Almost there</p>
            <h1 className="font-serif-display mt-3 text-3xl text-charcoal sm:text-4xl">
              Complete your profile
            </h1>
            <p className="mt-3 text-muted-foreground">
              A few quick details so we can tailor your experience. This is a
              one-time step.
            </p>
          </div>
          <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-card sm:p-8">
            <OnboardingForm defaultName={defaultName} next={dest} />
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
