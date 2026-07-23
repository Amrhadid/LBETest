import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { StubPageBody } from "@/components/StubPageBody";

export const metadata: Metadata = {
  title: "For Business",
  description:
    "Benchmark teams, screen candidates and measure training ROI with LBET's comparable Business English scores.",
};

export default function ForBusinessPage() {
  return (
    <PageShell>
      <StubPageBody
        icon={Building2}
        eyebrow="For Business"
        title="Benchmark your team's Business English"
        description="Consistent, comparable scores for hiring, upskilling and training ROI — with an admin dashboard and volume seat pricing."
        primaryHref="/start"
        primaryLabel="Talk to sales"
      />
    </PageShell>
  );
}
