import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateCertificatePdf } from "@/lib/certificates/pdf";
import { verifyUrlFor } from "@/lib/certificates/finalize";
import { loadCertificateTemplate } from "@/lib/certificates/template.server";
import { levelName, levelDescription } from "@/lib/certificates/eligibility";

export const dynamic = "force-dynamic";

/**
 * Admin-only live certificate PREVIEW. Renders a sample certificate through the
 * real `generateCertificatePdf` pipeline with placeholder data, so an admin can
 * see the exact template (fonts, layout, seal, QR) without needing a real
 * graduate. Reflects whatever certificate design is currently in the codebase.
 *
 * Query: ?level=1..5 (defaults to 3) picks which level badge to preview.
 * Returns the PDF inline (viewable in a browser tab / iframe).
 */
export async function GET(request: Request) {
  // Admin gate (manual, so we can return a clean 403 instead of an HTML redirect).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const level = Math.min(5, Math.max(1, Number(url.searchParams.get("level")) || 3));

  // Sample, clearly-fake data — a preview, never a real credential.
  const score = 73; // sample score out of 100
  const certCode = `LBE-${level}-PREVIEW`;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  try {
    const template = await loadCertificateTemplate();
    const pdf = await generateCertificatePdf(
      {
        candidateName: "Sample Candidate",
        candidatePhoto: null,
        level,
        levelName: levelName(level),
        levelDescription: levelDescription(level),
        score,
        certCode,
        candidateId: "29800000000000",
        issuedAt,
        expiresAt,
        verifyUrl: verifyUrlFor(certCode),
      },
      template,
    );

    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="certificate-preview-LBE${level}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new NextResponse(
      `Preview failed: ${e instanceof Error ? e.message : "unknown error"}`,
      { status: 500 },
    );
  }
}
