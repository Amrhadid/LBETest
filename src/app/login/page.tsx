import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { AuthForm } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your LBET account or create one to take the test.",
};

export default async function LoginPage() {
  // Already signed in? Skip the form. Never let an auth/session error crash the
  // page — fall through to the sign-in form if the check fails.
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = !!user;
  } catch {
    signedIn = false;
  }
  if (signedIn) {
    redirect("/dashboard");
  }

  return (
    <PageShell>
      <Section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pattern-guilloche pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow">Account</p>
          <h1 className="font-serif-display mt-3 text-4xl text-charcoal sm:text-5xl">
            Welcome to Locrativ
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Sign in to resume a test, view your results, or download your
            certificate.
          </p>
        </div>
        <AuthForm />
      </Section>
    </PageShell>
  );
}
