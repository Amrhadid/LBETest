import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { CERTIFICATES_BUCKET } from "@/lib/certificates/finalize";
import { AdminHeader, TableWrap } from "@/app/admin/ui";
import { CertActions } from "@/app/admin/certificates/CertActions";
import { CertificatePreview } from "@/app/admin/certificates/CertificatePreview";

export const metadata: Metadata = { title: "Admin — Certificates" };

export default async function AdminCertificatesPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const [{ data: certs }, emails] = await Promise.all([
    svc
      .from("certificates")
      .select("id, cert_code, user_id, lbe_level, score, status, issued_at, pdf_url")
      .order("issued_at", { ascending: false })
      .limit(500),
    emailMap(),
  ]);

  // Signed URLs for the private PDFs (30 min).
  const signed = new Map<string, string>();
  await Promise.all(
    (certs ?? [])
      .filter((c) => c.pdf_url)
      .map(async (c) => {
        const { data } = await svc.storage
          .from(CERTIFICATES_BUCKET)
          .createSignedUrl(c.pdf_url as string, 60 * 30);
        if (data?.signedUrl) signed.set(c.id, data.signedUrl);
      }),
  );

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Certificates"
        description="Issued certificates. View or download the PDF, or revoke a credential."
        actions={<CertificatePreview />}
      />

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Code</th>
            <th className="p-3">Candidate</th>
            <th className="p-3">Level</th>
            <th className="p-3">Status</th>
            <th className="p-3">Issued</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(certs ?? []).map((c) => (
            <tr key={c.id} className="border-b border-gold/10 last:border-0">
              <td className="p-3 font-mono text-xs">{c.cert_code}</td>
              <td className="p-3">{emails.get(c.user_id) ?? c.user_id.slice(0, 8)}</td>
              <td className="p-3">{c.lbe_level ? `LBE ${c.lbe_level}` : "—"}</td>
              <td className="p-3">
                <span className={c.status === "valid" ? "text-emerald-700" : "text-rose-700"}>
                  {c.status}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">{(c.issued_at ?? "").slice(0, 10) || "—"}</td>
              <td className="p-3">
                <div className="flex items-center justify-end gap-1">
                  {signed.get(c.id) ? (
                    <a
                      href={signed.get(c.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold underline-offset-4 hover:underline"
                    >
                      PDF
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">no PDF</span>
                  )}
                  <CertActions id={c.id} status={c.status} />
                </div>
              </td>
            </tr>
          ))}
          {(certs ?? []).length === 0 && (
            <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No certificates issued yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
