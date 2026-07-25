import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your LBET account dashboard.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-braces: middleware also gates this route, but guard here too.
  if (!user) {
    redirect("/login");
  }

  // Read the profile row auto-created on sign-up (RLS: own row only).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name ?? user.email ?? "there";

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
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-charcoal">Email:</span>{" "}
                  {user.email}
                </p>
                <p>
                  <span className="font-medium text-charcoal">Role:</span>{" "}
                  {profile?.role ?? "candidate"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your tests</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {/* TODO(exam-app): list the user's attempts and certificates
                    once the exam-taking flow is built. */}
                <p>
                  Your test attempts and certificates will appear here once the
                  exam app is live.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
