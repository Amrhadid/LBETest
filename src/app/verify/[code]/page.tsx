import type { Metadata } from "next";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { VerifyView } from "@/app/verify/VerifyView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description:
    "Confirm that a Locrativ Business English (LBE) certificate is authentic and see the LBE level it certifies.",
};

// Direct link the certificate QR encodes: /verify/<cert_code>.
export default async function VerifyByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <PageShell>
      <Section>
        <VerifyView code={decodeURIComponent(code)} />
      </Section>
    </PageShell>
  );
}
