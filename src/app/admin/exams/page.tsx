import type { Metadata } from "next";

import Link from "next/link";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader } from "@/app/admin/ui";
import { PreviewButton } from "@/app/admin/PreviewButton";
import { ExamEditor } from "@/app/admin/exams/ExamEditor";
import { CreateExam } from "@/app/admin/exams/CreateExam";

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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CreateExam />
            <PreviewButton />
          </div>
        }
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
            <div className="mt-1 flex gap-3 px-1 text-xs">
              <Link href={`/admin/library?exam=${e.id}`} className="text-gold underline-offset-4 hover:underline">
                Manage items →
              </Link>
              <Link href={`/admin/sections?exam=${e.id}`} className="text-gold underline-offset-4 hover:underline">
                Sections →
              </Link>
            </div>
          </div>
        ))}
        {(exams ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No exams yet.</p>
        )}
      </div>
    </div>
  );
}
