import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { StubPageBody } from "@/components/StubPageBody";

export const metadata: Metadata = {
  title: "For Schools",
  description:
    "Give students an internationally recognized Business English credential and track progress across cohorts with LBET.",
};

export default function ForInstitutionsPage() {
  return (
    <PageShell>
      <StubPageBody
        icon={GraduationCap}
        eyebrow="For Schools"
        title="A credential your students can carry"
        description="Offer an internationally recognized, CEFR-aligned certificate and measure progress across classes and cohorts."
        primaryHref="/start"
        primaryLabel="Partner with us"
      />
    </PageShell>
  );
}
