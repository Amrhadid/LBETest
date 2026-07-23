import type { Metadata } from "next";
import { User } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { StubPageBody } from "@/components/StubPageBody";

export const metadata: Metadata = {
  title: "For Individuals",
  description:
    "Certify your Business English level for a job, a promotion or a visa with LBET.",
};

export default function ForIndividualsPage() {
  return (
    <PageShell>
      <StubPageBody
        icon={User}
        eyebrow="For Individuals"
        title="Certify the English you use at work"
        description="Turn your Business English into proof you can share — a CEFR-aligned certificate employers recognize and can verify in seconds."
      />
    </PageShell>
  );
}
