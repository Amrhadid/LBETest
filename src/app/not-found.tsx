import { Compass } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { StubPageBody } from "@/components/StubPageBody";

export default function NotFound() {
  return (
    <PageShell>
      <StubPageBody
        icon={Compass}
        eyebrow="404"
        title="Page not found"
        description="The page you’re looking for doesn’t exist or has moved. Let’s get you back on track."
        primaryHref="/"
        primaryLabel="Back to home"
      />
    </PageShell>
  );
}
