import type { Metadata } from "next";
import { LogIn } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { StubPageBody } from "@/components/StubPageBody";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your LBET account.",
};

export default function LoginPage() {
  return (
    <PageShell>
      <StubPageBody
        icon={LogIn}
        eyebrow="Account"
        title="Log in"
        description="Accounts and sign-in arrive with the exam app. Authentication will be handled by Supabase in a later milestone."
        primaryHref="/start"
        primaryLabel="Take the test"
      />
    </PageShell>
  );
}
