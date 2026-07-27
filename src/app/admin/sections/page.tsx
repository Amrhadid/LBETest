import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { ACTIVE_EXAM_ID, parseExamConfig } from "@/lib/exam/config";
import { AdminHeader } from "@/app/admin/ui";
import { SectionsEditor } from "@/app/admin/sections/SectionsEditor";

export const metadata: Metadata = { title: "Admin — Sections" };

export default async function AdminSectionsPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { data: exam } = await svc
    .from("exams")
    .select("id, title, config")
    .eq("id", ACTIVE_EXAM_ID)
    .maybeSingle();

  const cfg = (exam?.config ?? {}) as {
    section_seconds?: number;
    sections?: Record<string, { seconds?: number; weight?: number }>;
  };
  const parsed = parseExamConfig(exam?.config);

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Sections"
        description={`Time limits and weights for the five LBE sections of ${exam?.title ?? "the active exam"}.`}
      />
      <SectionsEditor
        examId={ACTIVE_EXAM_ID}
        defaultSeconds={parsed.section_seconds}
        sections={cfg.sections ?? {}}
      />
    </div>
  );
}
