import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

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

export default async function AdminLibraryPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { data: items } = await svc
    .from("items")
    .select("id, lbe_level, question_type, source_type, prompt, active")
    .eq("exam_id", ACTIVE_EXAM_ID)
    .order("lbe_level", { ascending: true })
    .order("question_type", { ascending: true })
    .order("id", { ascending: true });

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Exam Library"
        description="The question/item bank for the active exam. Create, edit, activate or remove items."
        actions={
          <Link href="/admin/library/new">
            <Button size="sm"><Plus className="size-4" /> New item</Button>
          </Link>
        }
      />

      <p className="mb-3 text-sm text-muted-foreground">{(items ?? []).length} items</p>

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Sec</th>
            <th className="p-3">Type</th>
            <th className="p-3">Prompt</th>
            <th className="p-3">Active</th>
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
              <td className="p-3"><ItemRowActions id={it.id} active={it.active} /></td>
            </tr>
          ))}
          {(items ?? []).length === 0 && (
            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No items yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
