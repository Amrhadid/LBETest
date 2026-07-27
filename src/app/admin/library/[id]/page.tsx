import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { ACTIVE_EXAM_ID } from "@/lib/exam/config";
import { AdminHeader } from "@/app/admin/ui";
import { ItemForm } from "@/app/admin/library/ItemForm";

export const metadata: Metadata = { title: "Admin — Edit item" };

export default async function ItemEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ exam?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { exam } = await searchParams;

  if (id === "new") {
    return (
      <div>
        <AdminHeader eyebrow="Exam Library" title="New item" />
        <ItemForm examId={exam || ACTIVE_EXAM_ID} />
      </div>
    );
  }

  const svc = createServiceRoleClient();
  const { data: item } = await svc
    .from("items")
    .select("id, exam_id, lbe_level, question_type, source_type, prompt, media_url, options, answer_key, rubric, active")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  return (
    <div>
      <AdminHeader eyebrow="Exam Library" title="Edit item" description={`Section ${item.lbe_level} · type ${item.question_type}`} />
      <ItemForm examId={item.exam_id ?? ACTIVE_EXAM_ID} item={item} />
    </div>
  );
}
