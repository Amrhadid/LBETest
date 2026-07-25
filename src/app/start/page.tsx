import type { Metadata } from "next";
import { Rocket } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { StubPageBody } from "@/components/StubPageBody";

export const metadata: Metadata = {
  title: "Take the test",
  description: "Start the Locrativ Business English Test (LBET).",
};

export default function StartPage() {
  return (
    <PageShell>
      <StubPageBody
        icon={Rocket}
        eyebrow="Get started"
        title="The exam app is on its way"
        description="This is where the LBET exam will launch. The interactive test app plugs in here in a later milestone — for now, explore the homepage."
        primaryHref="/"
        primaryLabel="Back to home"
      />
    </PageShell>
  );
}
