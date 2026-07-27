import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader } from "@/app/admin/ui";
import { PreviewButton } from "@/app/admin/PreviewButton";
import { ExamEditor } from "@/app/admin/exams/ExamEditor";

export const metadata: Metadata = { title: "Admin — Exams" };

export default async function AdminExamsPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { data: exams } = await svc
    .from("exams")
    .select("id, code, title, version, status, created_at")
    .order("created_at", { ascending: true });

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Exams"
        description="Manage exam definitions — title, version and publication status."
        actions={<PreviewButton />}
      />

      <div className="space-y-4">
        {(exams ?? []).map((e) => (
          <div key={e.id}>
            <p className="mb-1 text-xs text-muted-foreground">
              {e.code ?? "—"} · {e.id}
            </p>
            <ExamEditor
              exam={{ id: e.id, title: e.title, version: e.version, status: e.status }}
            />
          </div>
        ))}
        {(exams ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No exams yet.</p>
        )}
      </div>
    </div>
  );
}
