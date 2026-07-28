import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Layers } from "lucide-react";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { ACTIVE_EXAM_ID } from "@/lib/exam/config";
import { Button } from "@/components/ui/button";
import { AdminHeader, TableWrap } from "@/app/admin/ui";
import { ItemRowActions } from "@/app/admin/library/ItemRowActions";

export const metadata: Metadata = { title: "Admin — Exam Library" };

const QT_LABEL: Record<number, string> = {
  1: "MCQ (correct)", 2: "MCQ (wrong)", 3: "Spoken situation",
  4: "Name term", 5: "Write definition", 6: "Spoken about source",
};

export default async function AdminLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  await requireAdmin();
  const { exam } = await searchParams;
  const examId = exam || ACTIVE_EXAM_ID;
  const svc = createServiceRoleClient();

  const [{ data: exams }, { data: items }] = await Promise.all([
    svc.from("exams").select("id, title, code").order("created_at", { ascending: true }),
    svc
      .from("items")
      .select("id, lbe_level, question_type, source_type, prompt, active, exposure_count")
      .eq("exam_id", examId)
      .order("lbe_level", { ascending: true })
      .order("question_type", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Exam Library"
        description="The question/item bank. Create, edit, activate or remove items."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/library/new?exam=${examId}`}>
              <Button size="sm"><Plus className="size-4" /> New item</Button>
            </Link>
            <Link href={`/admin/library/bulk?exam=${examId}&level=1`}>
              <Button size="sm" variant="outline"><Layers className="size-4" /> Add section (bulk)</Button>
            </Link>
          </div>
        }
      />

      {(exams ?? []).length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(exams ?? []).map((e) => (
            <Link
              key={e.id}
              href={`/admin/library?exam=${e.id}`}
              className={
                "rounded-full border px-3 py-1 text-xs " +
                (e.id === examId
                  ? "border-gold bg-gold/15 text-charcoal"
                  : "border-gold/25 text-muted-foreground hover:bg-gold/8")
              }
            >
              {e.title ?? e.code ?? e.id.slice(0, 8)}
            </Link>
          ))}
        </div>
      )}

      <p className="mb-3 text-sm text-muted-foreground">{(items ?? []).length} items</p>

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Sec</th>
            <th className="p-3">Type</th>
            <th className="p-3">Prompt</th>
            <th className="p-3">Active</th>
            <th className="p-3">Exposure</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((it) => (
            <tr key={it.id} className="border-b border-gold/10 last:border-0">
              <td className="p-3 font-medium">{it.lbe_level}</td>
              <td className="p-3 text-muted-foreground">{QT_LABEL[it.question_type ?? 0] ?? it.question_type}</td>
              <td className="max-w-sm truncate p-3">{it.prompt ?? "—"}</td>
              <td className="p-3">
                <span className={it.active ? "text-emerald-700" : "text-muted-foreground"}>
                  {it.active ? "Yes" : "No"}
                </span>
              </td>
              <td className="p-3 tabular-nums text-muted-foreground">{it.exposure_count ?? 0}</td>
              <td className="p-3"><ItemRowActions id={it.id} active={it.active} examId={examId} /></td>
            </tr>
          ))}
          {(items ?? []).length === 0 && (
            <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No items yet for this exam.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
