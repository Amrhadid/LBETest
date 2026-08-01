import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { CERTIFICATE_PHOTOS_BUCKET } from "@/lib/certificates/finalize";
import { AdminHeader } from "@/app/admin/ui";
import { PhotoReviewActions } from "@/app/admin/certificate-photos/PhotoReviewActions";

export const metadata: Metadata = { title: "Admin — Certificate photos" };

const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export default async function CertificatePhotosPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();

  const [{ data: profiles }, emails] = await Promise.all([
    svc
      .from("profiles")
      .select("id, full_name, certificate_photo_path, certificate_photo_status")
      .not("certificate_photo_path", "is", null)
      .order("certificate_photo_status", { ascending: true }),
    emailMap(),
  ]);

  // Order: pending first, then the rest.
  const rows = (profiles ?? []).slice().sort((a, b) => {
    const rank = (s: string | null) => (s === "pending" ? 0 : s === "rejected" ? 1 : 2);
    return rank(a.certificate_photo_status) - rank(b.certificate_photo_status);
  });

  const urls = new Map<string, string>();
  await Promise.all(
    rows.map(async (p) => {
      if (!p.certificate_photo_path) return;
      const { data } = await svc.storage
        .from(CERTIFICATE_PHOTOS_BUCKET)
        .createSignedUrl(p.certificate_photo_path, 60 * 30);
      if (data?.signedUrl) urls.set(p.id, data.signedUrl);
    }),
  );

  const pendingCount = rows.filter((p) => p.certificate_photo_status === "pending").length;

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Certificate photos"
        description="Review candidate-uploaded certificate photos. Approved photos are embedded on newly generated certificates and are locked from candidate edits."
      />
      <p className="mb-6 text-sm text-muted-foreground">
        {pendingCount} awaiting approval
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No certificate photos uploaded yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((p) => {
            const status = p.certificate_photo_status ?? "pending";
            return (
              <div key={p.id} className="rounded-2xl border border-gold/20 bg-card p-5 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="size-24 shrink-0 overflow-hidden rounded-xl border border-gold/20 bg-muted/40">
                    {urls.get(p.id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls.get(p.id)} alt="Certificate photo" className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-xs text-muted-foreground">—</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-charcoal">
                      {p.full_name ?? "—"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {emails.get(p.id) ?? p.id.slice(0, 8)}
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_CLS[status] ?? ""}`}>
                      {status}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <PhotoReviewActions userId={p.id} status={status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
